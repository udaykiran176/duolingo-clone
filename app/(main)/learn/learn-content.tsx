"use client";

import React from "react";

import { motion } from "framer-motion";

import { usePrefetchNextLesson } from "@/lib/hooks/use-learn";

import { Unit } from "./unit";

type LearnContentProps = {
  units: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      id: number;
      title: string;
      order: number;
      completed: boolean;
    }>;
  }>;
  activeLesson: {
    id: number;
    title: string;
    unitId: number;
  } | null;
  activeLessonPercentage: number;
};

export function LearnContent({
  units,
  activeLesson,
  activeLessonPercentage,
}: LearnContentProps) {
  const prefetchNextLesson = usePrefetchNextLesson();

  // Prefetch the next lesson when active lesson changes
  React.useEffect(() => {
    if (activeLesson) {
      // Find the next lesson
      const currentUnit = units.find((u) => u.id === activeLesson.unitId);
      if (currentUnit) {
        const currentLessonIndex = currentUnit.lessons.findIndex(
          (l) => l.id === activeLesson.id
        );
        const nextLesson = currentUnit.lessons[currentLessonIndex + 1];
        if (nextLesson) {
          prefetchNextLesson(nextLesson.id);
        }
      }
    }
  }, [activeLesson, units, prefetchNextLesson]);

  return (
    <>
      {units.map((unit, unitIndex) => (
        <motion.div
          key={unit.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: unitIndex * 0.1 }}
          className="mb-10"
        >
          <Unit
            id={unit.id}
            order={unit.order}
            description={unit.description}
            title={unit.title}
            lessons={unit.lessons.map((lesson) => ({
              ...lesson,
              unitId: unit.id,
            }))}
            activeLesson={activeLesson}
            activeLessonPercentage={activeLessonPercentage}
          />
        </motion.div>
      ))}
    </>
  );
}

