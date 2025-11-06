import { Suspense } from "react";

import { CoursesList } from "./courses-list";
import CoursesLoading from "./loading";

export default function CoursesPage() {
  return (
    <div className="mx-auto h-full max-w-[912px] px-3">
      <h1 className="text-2xl font-bold text-neutral-700">Select the course</h1>

      <Suspense fallback={<CoursesLoading />}>
        <CoursesList />
      </Suspense>
    </div>
  );
}
