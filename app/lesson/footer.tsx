import { useEffect, useState, useRef, useCallback } from "react";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useKey, useMedia } from "react-use";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FooterProps = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
};

const COUNTDOWN_DURATION = 3; // seconds

export const Footer = ({
  onCheck,
  status,
  disabled,
  lessonId,
}: FooterProps) => {
  const isMobile = useMedia("(max-width: 1024px)");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef(status);
  const isManuallyTriggeredRef = useRef(false);

  // Handler to clear countdown and proceed
  const handleProceed = useCallback(() => {
    // Mark as manually triggered to prevent auto-proceed
    isManuallyTriggeredRef.current = true;
    // Clear countdown if user manually triggers action
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    setCountdown(null);
    onCheck();
  }, [onCheck]);

  // Update status ref when status changes
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Start countdown when status changes to "correct" or "wrong"
  useEffect(() => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Start countdown for correct or wrong answers
    if (status === "correct" || status === "wrong") {
      // Reset manual trigger flag when starting new countdown
      isManuallyTriggeredRef.current = false;
      setShowCountdown(true);
      setCountdown(COUNTDOWN_DURATION);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            // Countdown finished, automatically proceed
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setShowCountdown(false);
            // Only auto-proceed if status is still correct/wrong and not manually triggered
            if (
              !isManuallyTriggeredRef.current &&
              (statusRef.current === "correct" || statusRef.current === "wrong")
            ) {
              // Small delay to ensure UI updates before calling onCheck
              setTimeout(() => {
                onCheck();
              }, 100);
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset countdown when status changes away from correct/wrong
      setShowCountdown(false);
      setCountdown(null);
      isManuallyTriggeredRef.current = false;
    }

    // Cleanup on unmount or status change
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [status, onCheck]);

  // Handle Enter key press
  useKey("Enter", handleProceed, {}, [handleProceed]);

  return (
    <footer
      className={cn(
        "h-[100px] border-t-2 lg:h-[140px]",
        status === "correct" && "border-transparent bg-orange-100",
        status === "wrong" && "border-transparent bg-rose-100"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-6 lg:px-10">
        {status === "correct" && (
          <div className="flex items-center text-base font-bold text-orange-500 lg:text-2xl">
            <CheckCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            Nicely done!
          </div>
        )}

        {status === "wrong" && (
          <div className="flex items-center text-base font-bold text-rose-500 lg:text-2xl">
            <XCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            Try again.
          </div>
        )}

        {status === "completed" && (
          <Button
            variant="default"
            size={isMobile ? "sm" : "lg"}
            onClick={() => (window.location.href = `/lesson/${lessonId}`)}
          >
            Practice again
          </Button>
        )}

        <Button
          disabled={disabled}
          aria-disabled={disabled}
          className="ml-auto relative"
          onClick={handleProceed}
          size={isMobile ? "sm" : "lg"}
          variant={status === "wrong" ? "danger" : "primary"}
        >
          {showCountdown && countdown !== null ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin lg:h-5 lg:w-5" />
              <span className="transition-all duration-300">
                {status === "correct"
                  ? `Next in ${countdown}...`
                  : `Retry in ${countdown}...`}
              </span>
            </div>
          ) : (
            <>
              {status === "none" && "Check"}
              {status === "correct" && "Next"}
              {status === "wrong" && "Retry"}
              {status === "completed" && "Continue"}
            </>
          )}
        </Button>
      </div>
    </footer>
  );
};
