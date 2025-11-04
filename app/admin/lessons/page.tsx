"use client";

import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  unitId: z.string().min(1, "Unit is required"),
});

type Lesson = {
  id: number;
  title: string;
  unitId: number;
  order: number;
};

type Unit = {
  id: number;
  title: string;
  description: string;
  courseId: number;
  order: number;
};

type LessonFormData = z.infer<typeof lessonSchema>;

async function fetchLessons(unitId?: string): Promise<Lesson[]> {
  const url = unitId ? `/api/lessons?unitId=${unitId}` : "/api/lessons";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch lessons");
  return (await res.json()) as Lesson[];
}

async function fetchUnits(courseId?: string): Promise<Unit[]> {
  const url = courseId ? `/api/units?courseId=${courseId}` : "/api/units";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch units");
  return (await res.json()) as Unit[];
}

async function createLesson(data: LessonFormData): Promise<Lesson> {
  const res = await fetch("/api/lessons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to create lesson" }))) as { error?: string };
    throw new Error(error.error || "Failed to create lesson");
  }
  return (await res.json()) as Lesson;
}

async function updateLesson(
  id: number,
  data: LessonFormData
): Promise<Lesson> {
  const res = await fetch(`/api/lessons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to update lesson" }))) as { error?: string };
    throw new Error(error.error || "Failed to update lesson");
  }
  return (await res.json()) as Lesson;
}

async function deleteLesson(id: number): Promise<void> {
  const res = await fetch(`/api/lessons/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete lesson");
}

async function reorderLessons(items: { id: number; order: number }[]): Promise<void> {
  const res = await fetch("/api/lessons/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to reorder lessons" }))) as { error?: string; details?: string };
    throw new Error(error.error || error.details || "Failed to reorder lessons");
  }
}

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get("unitId");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      unitId: unitIdParam || "",
    },
  });

  // Update form when unitId param changes
  useEffect(() => {
    if (unitIdParam) {
      form.setValue("unitId", unitIdParam);
    }
  }, [unitIdParam, form]);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["lessons", unitIdParam],
    queryFn: () => fetchLessons(unitIdParam || undefined),
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetchUnits(),
  });

  const createMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson created successfully");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create lesson");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LessonFormData }) =>
      updateLesson(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson updated successfully");
      setIsDialogOpen(false);
      setEditingLesson(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update lesson");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete lesson");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderLessons,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lessons reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder lessons");
      console.error("Reorder error:", error);
    },
  });

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      form.reset({
        title: lesson.title,
        unitId: lesson.unitId.toString(),
      });
    } else {
      setEditingLesson(null);
      form.reset({
        title: "",
        unitId: unitIdParam || "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: LessonFormData) => {
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReorder = (newItems: Lesson[]) => {
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    reorderMutation.mutate(itemsWithOrder);
  };

  const selectedUnit = units.find((u) => u.id.toString() === unitIdParam);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: "Units", href: "/admin/units" },
            { label: "Lessons" },
          ]}
        />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Courses", href: "/admin/courses" },
              {
                label: selectedUnit
                  ? `Units - ${selectedUnit.title}`
                  : "Units",
                href: selectedUnit
                  ? `/admin/units?courseId=${selectedUnit.courseId}`
                  : "/admin/units",
              },
              {
                label: selectedUnit ? `${selectedUnit.title} - Lessons` : "Lessons",
              },
            ]}
          />
          <div className="mt-2 flex items-center gap-4">
            {unitIdParam && (
              <Link href={`/admin/units?courseId=${selectedUnit?.courseId || ""}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Units
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold">Lessons</h1>
              <p className="text-muted-foreground">
                {selectedUnit
                  ? `Manage lessons for ${selectedUnit.title}`
                  : "Manage your lessons and their order"}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground">
              {unitIdParam
                ? "No lessons found for this unit. Create one to get started."
                : "No lessons found. Create one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DraggableList
          items={lessons}
          onReorder={handleReorder}
          renderItem={(lesson) => {
            const lessonUnit = units.find((u) => u.id === lesson.unitId);
            return (
              <Card className="flex-1">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Order: {lesson.order}</span>
                          {lessonUnit && (
                            <span>Unit: {lessonUnit.title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/challenges?lessonId=${lesson.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(lesson)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lesson.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }}
        />
      )}

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingLesson ? "Edit Lesson" : "Create Lesson"}
        description={
          editingLesson
            ? "Update the lesson details"
            : "Add a new lesson to your platform"
        }
        onSubmit={() => {
          void form.handleSubmit(handleSubmit)();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form {...form}>
          <div className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!unitIdParam}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lesson 1" {...field} />
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

