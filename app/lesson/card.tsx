import { useCallback } from "react";

import Image from "next/image";
import { useAudio, useKey } from "react-use";
import { motion } from "framer-motion";

import { challenges } from "@/db/schema";
import { cn } from "@/lib/utils";

type CardProps = {
  id: number;
  text: string;
  imageSrc: string | null;
  audioSrc: string | null;
  shortcut: string;
  selected?: boolean;
  onClick: () => void;
  status?: "correct" | "wrong" | "none";
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
};

export const Card = ({
  text,
  imageSrc,
  audioSrc,
  shortcut,
  selected,
  onClick,
  status,
  disabled,
  type,
}: CardProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audio, _, controls] = useAudio({ src: audioSrc || "" });

  const handleClick = useCallback(() => {
    if (disabled) return;

    void controls.play();
    onClick();
  }, [disabled, onClick, controls]);

  useKey(shortcut, handleClick, {}, [handleClick]);

  const isCorrect = status === "correct";
  const isWrong = status === "wrong";

  return (
    <motion.div
      onClick={handleClick}
      className={cn(
        "h-full cursor-pointer rounded-xl border-2 border-b-4 p-4 hover:bg-black/5 active:border-b-2 lg:p-6",
        selected && "border-sky-300 bg-sky-100 hover:bg-sky-100",
        selected &&
          status === "correct" &&
          "border-orange-300 bg-orange-100 hover:bg-orange-100",
        selected &&
          status === "wrong" &&
          "border-rose-300 bg-rose-100 hover:bg-rose-100",
        disabled && "pointer-events-none hover:bg-white",
        type === "ASSIST" && "w-full lg:p-3"
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{
        scale: isCorrect ? [1, 1.05, 1] : isWrong ? [1, 0.95, 1] : 1,
      }}
      transition={{
        duration: isCorrect || isWrong ? 0.3 : 0.2,
        ease: "easeInOut",
      }}
    >
      {audio}
      {imageSrc && (
        <div className="relative mb-4 aspect-square max-h-[80px] w-full lg:max-h-[150px]">
          <Image
            src={imageSrc}
            fill
            alt={text}
            loading="lazy"
            sizes="(max-width: 768px) 80px, 150px"
            className="object-contain"
          />
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between",
          type === "ASSIST" && "flex-row-reverse"
        )}
      >
        {type === "ASSIST" && <div aria-hidden />}
        <p
          className={cn(
            "text-sm text-neutral-600 lg:text-base",
            selected && "text-sky-500",
            selected && status === "correct" && "text-orange-500",
            selected && status === "wrong" && "text-rose-500"
          )}
        >
          {text}
        </p>

        <div
          className={cn(
            "flex h-[20px] w-[20px] items-center justify-center rounded-lg border-2 text-xs font-semibold text-neutral-400 lg:h-[30px] lg:w-[30px] lg:text-[15px]",
            selected && "border-sky-300 text-sky-500",
            selected &&
              status === "correct" &&
              "border-orange-500 text-orange-500",
            selected && status === "wrong" && "border-rose-500 text-rose-500"
          )}
        >
          {shortcut}
        </div>
      </div>
    </motion.div>
  );
};
