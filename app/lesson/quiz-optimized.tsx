"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize, useMount } from "react-use";
import { toast } from "sonner";

import { checkAnswer } from "@/actions/challenge-answer";
import { MAX_HEARTS } from "@/constants";
import { challengeOptions, challenges, userSubscription } from "@/db/schema";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";

import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ResultCard } from "./result-card";

type QuizProps = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  userSubscription:
    | (typeof userSubscription.$inferSelect & {
        isActive: boolean;
      })
    | null;
};

export const QuizOptimized = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonChallenges,
  userSubscription,
}: QuizProps) => {
  const [correctAudio, , correctControls] = useAudio({ src: "/correct.wav" });
  const [incorrectAudio, , incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio] = useAudio({
    src: "/finish.mp3",
    autoPlay: true,
  });
  const { width, height } = useWindowSize();

  const router = useRouter();
  const queryClient = useQueryClient();
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  useMount(() => {
    if (initialPercentage === 100) openPracticeModal();
  });

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(() => {
    return initialPercentage === 100 ? 0 : initialPercentage;
  });

  // Store all challenges in memory for instant navigation
  const [challenges] = useState(initialLessonChallenges);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex(
      (challenge) => !challenge.completed
    );
    return uncompletedIndex === -1 ? 0 : uncompletedIndex;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"none" | "wrong" | "correct" | "checking">("none");
  const checkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCorrectRef = useRef<boolean>(false);

  const challenge = challenges[activeIndex];
  const options = useMemo(() => {
    if (!challenge?.challengeOptions) return [];
    const opts = [...challenge.challengeOptions];
    if (challenge.randomOrder) {
      // Shuffle array using Fisher-Yates algorithm
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
    } else {
      // Sort by order field
      opts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return opts;
  }, [challenge]);

  // Preload correct answer ID for instant client-side checking
  const correctOptionId = useMemo(() => {
    if (!challenge?.challengeOptions) return undefined;
    const correctOption = challenge.challengeOptions.find((opt) => opt.correct);
    return correctOption?.id;
  }, [challenge]);

  // Calculate progress increment
  const progressIncrement = useMemo(
    () => 100 / challenges.length,
    [challenges.length]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }
    };
  }, []);

  // Optimistic answer mutation
  const answerMutation = useMutation({
    mutationFn: ({ challengeId, optionId }: { challengeId: number; optionId: number }) =>
      checkAnswer(challengeId, optionId),
    onMutate: ({ optionId }) => {
      // Store the correct answer check
      const isCorrect = correctOptionId === optionId;
      isCorrectRef.current = isCorrect;

      // Clear any existing timeout
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }

      // After 1.5 seconds, show feedback (only if still in checking state)
      checkingTimeoutRef.current = setTimeout(() => {
        // Only show feedback if we're still in checking state
        // (status might have changed if server responded with error)
        setStatus((currentStatus) => {
          if (currentStatus === "checking") {
            if (isCorrect) {
              void correctControls.play();
              // Optimistically update progress
              setPercentage((prev) => Math.min(prev + progressIncrement, 100));
              if (initialPercentage === 100) {
                setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
              }
              return "correct";
            } else {
              void incorrectControls.play();
              if (!userSubscription?.isActive) {
                setHearts((prev) => Math.max(prev - 1, 0));
              }
              return "wrong";
            }
          }
          return currentStatus;
        });
        checkingTimeoutRef.current = null;
      }, 1500); // 1.5 second delay for checking

      // Return context for error handling
      return { isCorrect };
    },
    onSuccess: (data) => {
      if (data.error === "hearts") {
        // Clear checking timeout immediately for errors
        if (checkingTimeoutRef.current) {
          clearTimeout(checkingTimeoutRef.current);
          checkingTimeoutRef.current = null;
        }
        openHeartsModal();
        // Revert optimistic updates (status and percentage if correct)
        if (data.isCorrect) {
          setPercentage((prev) => Math.max(prev - progressIncrement, 0));
        }
        setStatus("none");
        setSelectedOption(undefined);
        return;
      }

      // For successful responses, let the timeout handle showing feedback
      // The timeout will show correct/wrong after 1.5s, then we update hearts here
      // Update hearts and points from server response
      if (data.hearts !== undefined) {
        setHearts(data.hearts);
      }
      // data.points ignored (not displayed here)

      // Invalidate queries to sync cache
      void queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
    onError: (error, _variables, context) => {
      // Clear checking timeout immediately for errors
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
        checkingTimeoutRef.current = null;
      }

      // Revert optimistic updates on error
      if (context?.isCorrect) {
        setPercentage((prev) => Math.max(prev - progressIncrement, 0));
      }
      setStatus("none");
      setSelectedOption(undefined);
      toast.error("Something went wrong. Please try again.");
      console.error("Answer check error:", error);
    },
  });

  const onNext = useCallback(() => {
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      setActiveIndex((current) => current + 1);
      setStatus("none");
      setSelectedOption(undefined);
    });
  }, []);

  const onSelect = useCallback((id: number) => {
    if (status !== "none" || answerMutation.isPending) return;
    setSelectedOption(id);
  }, [status, answerMutation.isPending]);

  const onContinue = useCallback(() => {
    if (!selectedOption || !challenge) return;

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    if (status === "correct") {
      onNext();
      return;
    }

    // Start checking phase - show loader
    setStatus("checking");

    // Submit answer - mutation will handle the delay and feedback
    answerMutation.mutate({
      challengeId: challenge.id,
      optionId: selectedOption,
    });
  }, [selectedOption, challenge, status, answerMutation, onNext]);

  if (!challenge) {
    return (
      <>
        {finishAudio}
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-4 text-center lg:gap-y-8">
          <Image
            src="/finish.png"
            alt="Finish"
            className="hidden lg:block"
            height={100}
            width={100}
            priority
          />

          <Image
            src="/finish.png"
            alt="Finish"
            className="block lg:hidden"
            height={100}
            width={100}
            priority
          />

          <h1 className="text-lg font-bold text-neutral-700 lg:text-3xl">
          Smart hit! <br />challenges cleared — next quiz unlocked 🎯
          </h1>

          <div className="flex w-full items-center gap-x-4">
            <ResultCard variant="points" value={challenges.length * 10} />
            <ResultCard
              variant="hearts"
              value={userSubscription?.isActive ? Infinity : hearts}
            />
          </div>
        </div>

        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push("/learn")}
        />
      </>
    );
  }

  const title =
    challenge.type === "ASSIST"
      ? "Select the correct answer"
      : challenge.question;

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />

      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex w-full flex-col gap-y-2 px-6 lg:min-h-[350px] lg:w-[600px] lg:px-0"
            >
              <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-start lg:text-3xl">
                {title}
              </h1>

              {challenge.imageSrc && (
                <div className="relative my-4 aspect-video w-full max-w-md mx-auto lg:max-w-lg">
                  <Image
                    src={challenge.imageSrc}
                    alt={challenge.question}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              )}

              <div>
                {challenge.type === "ASSIST" && (
                  <QuestionBubble question={challenge.question} imageSrc={challenge.imageSrc} />
                )}

                <Challenge
                  options={options}
                  onSelect={onSelect}
                  status={status === "checking" ? "none" : status}
                  selectedOption={selectedOption}
                  disabled={answerMutation.isPending || status === "checking"}
                  type={challenge.type}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Footer
        disabled={answerMutation.isPending || !selectedOption || status === "checking"}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};

