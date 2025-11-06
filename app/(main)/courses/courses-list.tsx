"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { upsertUserProgress } from "@/actions/user-progress";
import { useCourses } from "@/lib/hooks/use-courses";

import { Card } from "./card";

export function CoursesList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  const { data, isLoading, error } = useCourses();

  const onClick = (id: number) => {
    if (pending) return;

    if (id === data?.activeCourseId) {
      router.push("/learn");
      return;
    }

    startTransition(() => {
      upsertUserProgress(id)
        .then(() => {
          // Invalidate and refetch courses
          queryClient.invalidateQueries({ queryKey: ["courses"] });
          router.push("/learn");
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full min-h-[217px] min-w-[200px] animate-pulse flex-col items-center justify-between rounded-xl border-2 border-b-[4px] bg-gray-100 p-3 pb-6"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-6 text-center text-red-500">
        Failed to load courses. Please try again.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {data.courses.map((course, index) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            id={course.id}
            title={course.title}
            imageSrc={course.imageSrc}
            onClick={onClick}
            disabled={pending}
            isActive={course.id === data.activeCourseId}
          />
        </motion.div>
      ))}
    </div>
  );
}

