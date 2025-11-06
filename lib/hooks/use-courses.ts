"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

type Course = {
  id: number;
  title: string;
  imageSrc: string;
  order: number;
};

type CoursesResponse = {
  courses: Course[];
  activeCourseId: number | null;
};

async function fetchCourses(): Promise<CoursesResponse> {
  const response = await fetch("/api/courses/page");
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function usePrefetchCourses() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ["courses"],
      queryFn: fetchCourses,
      staleTime: 10 * 60 * 1000,
    });
  };
}

