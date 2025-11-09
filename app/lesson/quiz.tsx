"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAudio, useWindowSize, useMount } from "react-use";
import { toast } from "sonner";

// Lazy load Confetti for better performance
const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

import { checkAnswer } from "@/actions/challenge-answer";
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

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonChallenges,
  userSubscription,
}: QuizProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incorrectAudio, _i, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio] = useAudio({
    src: "/finish.mp3",
    autoPlay: true,
  });
  const { width, height } = useWindowSize();

  const router = useRouter();
  const [pending, startTransition] = useTransition();
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

  const onNext = () => {
    setActiveIndex((current) => current + 1);
  };

  const onSelect = (id: number) => {
    if (status !== "none") return;
    setSelectedOption(id);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }
    };
  }, []);

  const onContinue = () => {
    if (!selectedOption || !challenge) return;

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    if (status === "correct") {
      onNext();
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    // Start checking phase - show loader
    setStatus("checking");

    // Clear any existing timeout
    if (checkingTimeoutRef.current) {
      clearTimeout(checkingTimeoutRef.current);
    }

    // Store the correct answer check
    const isCorrect = correctOptionId === selectedOption;

    // Start server call immediately in background
    startTransition(() => {
      checkAnswer(challenge.id, selectedOption)
        .then((response) => {
          if (response.error === "hearts") {
            // Clear checking timeout if server responds with error
            if (checkingTimeoutRef.current) {
              clearTimeout(checkingTimeoutRef.current);
              checkingTimeoutRef.current = null;
            }
            openHeartsModal();
            // Revert optimistic updates if hearts error
            setStatus("none");
            setSelectedOption(undefined);
            return;
          }

          // Update hearts from server response
          if (response.hearts !== undefined) {
            setHearts(response.hearts);
          }

          // This is a practice - update hearts if needed
          if (initialPercentage === 100 && response.hearts !== undefined) {
            setHearts(response.hearts);
          }
        })
        .catch(() => {
          // Clear checking timeout on error
          if (checkingTimeoutRef.current) {
            clearTimeout(checkingTimeoutRef.current);
            checkingTimeoutRef.current = null;
          }
          toast.error("Something went wrong. Please try again.");
          // Revert optimistic updates on error
          setStatus("none");
          setSelectedOption(undefined);
        });
    });

    // After 1.5 seconds, show feedback (only if still in checking state)
    checkingTimeoutRef.current = setTimeout(() => {
      // Only show feedback if we're still in checking state
      // (status might have changed if server responded with error)
      setStatus((currentStatus) => {
        if (currentStatus === "checking") {
          if (isCorrect) {
            void correctControls.play();
            setPercentage((prev) => prev + 100 / challenges.length);
            return "correct";
          } else {
            void incorrectControls.play();
            return "wrong";
          }
        }
        return currentStatus;
      });
      checkingTimeoutRef.current = null;
    }, 1500); // 1.5 second delay for checking
  };

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
          />

          <Image
            src="/finish.png"
            alt="Finish"
            className="block lg:hidden"
            height={100}
            width={100}
          />

          <h1 className="text-lg font-bold text-neutral-700 lg:text-3xl">
            Great job! <br /> You&apos;ve completed the all challenges.
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
          <div className="flex w-full flex-col gap-y-2 px-6 lg:min-h-[350px] lg:w-[600px] lg:px-0">
            <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-start lg:text-3xl">
              {title}
            </h1>

            {challenge.imageSrc && (
              <div className="relative aspect-video w-full h-32 mx-auto">
                <Image
                  src={challenge.imageSrc}
                  alt={challenge.question}
                  fill
                  className="object-contain rounded-lg"
                  sizes="(max-width: 200px) 100vw, 200px"
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
                disabled={pending || status === "checking"}
                type={challenge.type}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer
        disabled={pending || !selectedOption || status === "checking"}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};

