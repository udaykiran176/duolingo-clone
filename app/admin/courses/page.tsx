"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Breadcrumb } from "@/components/admin/breadcrumb";
import { DraggableList } from "@/components/admin/draggable-list";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  imageSrc: z.string().min(1, "Image source is required"),
});

type Course = {
  id: number;
  title: string;
  imageSrc: string;
  order: number;
};

type CourseFormData = z.infer<typeof courseSchema>;

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  return (await res.json()) as Course[];
}

async function createCourse(data: CourseFormData): Promise<Course> {
  const res = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create course");
  return (await res.json()) as Course;
}

async function updateCourse(
  id: number,
  data: CourseFormData
): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update course");
  return (await res.json()) as Course;
}

async function deleteCourse(id: number): Promise<void> {
  const res = await fetch(`/api/courses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete course");
}

async function reorderCourses(items: { id: number; order: number }[]): Promise<void> {
  const res = await fetch("/api/courses/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to reorder courses" }))) as { error?: string; details?: string };
    throw new Error(error.error || error.details || "Failed to reorder courses");
  }
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      imageSrc: "",
    },
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course created successfully");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create course");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseFormData }) =>
      updateCourse(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course updated successfully");
      setIsDialogOpen(false);
      setEditingCourse(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update course");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete course");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderCourses,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Courses reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder courses");
      console.error("Reorder error:", error);
    },
  });

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      form.reset({
        title: course.title,
        imageSrc: course.imageSrc,
      });
    } else {
      setEditingCourse(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: CourseFormData) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReorder = (newItems: Course[]) => {
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    reorderMutation.mutate(itemsWithOrder);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Courses" }]} />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "Courses" }]} />
          <h1 className="mt-2 text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses and their order
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      <DraggableList
        items={courses}
        onReorder={handleReorder}
        renderItem={(course) => (
          <Card className="flex-1">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image
                    src={course.imageSrc}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Order: {course.order}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/units?courseId=${course.id}`}>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(course)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      />

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingCourse ? "Edit Course" : "Create Course"}
        description={
          editingCourse
            ? "Update the course details"
            : "Add a new course to your platform"
        }
        onSubmit={() => {
          void form.handleSubmit(handleSubmit)();
        }}
        isLoading={
          createMutation.isPending || updateMutation.isPending
        }
      >
        <Form {...form}>
          <div className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Spanish" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Source</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., /es.svg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </FormDialog>
    </div>
  );
}

