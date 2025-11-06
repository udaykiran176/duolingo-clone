"use client";

import { useState, useCallback, useMemo } from "react";

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
  const [status, setStatus] = useState<"none" | "wrong" | "correct">("none");

  const challenge = challenges[activeIndex];
  const options = challenge?.challengeOptions ?? [];

  // Calculate progress increment
  const progressIncrement = useMemo(
    () => 100 / challenges.length,
    [challenges.length]
  );

  // Optimistic answer mutation
  const answerMutation = useMutation({
    mutationFn: ({ challengeId, optionId }: { challengeId: number; optionId: number }) =>
      checkAnswer(challengeId, optionId),
    onMutate: ({ optionId }) => {
      // Optimistic update - show feedback immediately
      const correctOption = options.find((opt) => opt.correct);
      const isCorrect = correctOption?.id === optionId;

      if (isCorrect) {
        setStatus("correct");
        void correctControls.play();
        // Optimistically update progress
        setPercentage((prev) => Math.min(prev + progressIncrement, 100));
        if (initialPercentage === 100) {
          setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
        }
      } else {
        setStatus("wrong");
        void incorrectControls.play();
        if (!userSubscription?.isActive) {
          setHearts((prev) => Math.max(prev - 1, 0));
        }
      }
    },
    onSuccess: (data) => {
      if (data.error === "hearts") {
        openHeartsModal();
        // Revert optimistic updates
        setStatus("none");
        setSelectedOption(undefined);
        return;
      }

      // Update hearts and points from server response
      if (data.hearts !== undefined) {
        setHearts(data.hearts);
      }
      // data.points ignored (not displayed here)

      // Invalidate queries to sync cache
      void queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
    onError: (error) => {
      // Revert optimistic updates on error
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

    // Submit answer with optimistic UI
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
            src="/finish.svg"
            alt="Finish"
            className="hidden lg:block"
            height={100}
            width={100}
            priority
          />

          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden"
            height={100}
            width={100}
            priority
          />

          <h1 className="text-lg font-bold text-neutral-700 lg:text-3xl">
            Great job! <br /> You&apos;ve completed the lesson.
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

              <div>
                {challenge.type === "ASSIST" && (
                  <QuestionBubble question={challenge.question} />
                )}

                <Challenge
                  options={options}
                  onSelect={onSelect}
                  status={status}
                  selectedOption={selectedOption}
                  disabled={answerMutation.isPending}
                  type={challenge.type}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Footer
        disabled={answerMutation.isPending || !selectedOption}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};

