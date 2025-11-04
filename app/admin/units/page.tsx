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

const unitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.string().min(1, "Course is required"),
});

type Unit = {
  id: number;
  title: string;
  description: string;
  courseId: number;
  order: number;
};

type Course = {
  id: number;
  title: string;
  imageSrc: string;
  order: number;
};

type UnitFormData = z.infer<typeof unitSchema>;

async function fetchUnits(courseId?: string): Promise<Unit[]> {
  const url = courseId
    ? `/api/units?courseId=${courseId}`
    : "/api/units";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch units");
  return (await res.json()) as Unit[];
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  return (await res.json()) as Course[];
}

async function createUnit(data: UnitFormData): Promise<Unit> {
  const res = await fetch("/api/units", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to create unit" }))) as { error?: string };
    throw new Error(error.error || "Failed to create unit");
  }
  return (await res.json()) as Unit;
}

async function updateUnit(
  id: number,
  data: UnitFormData
): Promise<Unit> {
  const res = await fetch(`/api/units/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to update unit" }))) as { error?: string };
    throw new Error(error.error || "Failed to update unit");
  }
  return (await res.json()) as Unit;
}

async function deleteUnit(id: number): Promise<void> {
  const res = await fetch(`/api/units/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete unit");
}

async function reorderUnits(items: { id: number; order: number }[]): Promise<void> {
  const res = await fetch("/api/units/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const error = (await res
      .json()
      .catch(() => ({ error: "Failed to reorder units" }))) as { error?: string; details?: string };
    throw new Error(error.error || error.details || "Failed to reorder units");
  }
}

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: courseIdParam || "",
    },
  });

  // Update form when courseId param changes
  useEffect(() => {
    if (courseIdParam) {
      form.setValue("courseId", courseIdParam);
    }
  }, [courseIdParam, form]);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["units", courseIdParam],
    queryFn: () => fetchUnits(courseIdParam || undefined),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit created successfully");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create unit");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UnitFormData }) =>
      updateUnit(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit updated successfully");
      setIsDialogOpen(false);
      setEditingUnit(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update unit");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete unit");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderUnits,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Units reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder units");
      console.error("Reorder error:", error);
    },
  });

  const handleOpenDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      form.reset({
        title: unit.title,
        description: unit.description,
        courseId: unit.courseId.toString(),
      });
    } else {
      setEditingUnit(null);
      form.reset({
        title: "",
        description: "",
        courseId: courseIdParam || "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: UnitFormData) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this unit?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleReorder = (newItems: Unit[]) => {
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    reorderMutation.mutate(itemsWithOrder);
  };

  const selectedCourse = courses.find(
    (c) => c.id.toString() === courseIdParam
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: "Units" },
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
                label: selectedCourse
                  ? `${selectedCourse.title} - Units`
                  : "Units",
              },
            ]}
          />
          <div className="mt-2 flex items-center gap-4">
            {courseIdParam && (
              <Link href="/admin/courses">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Courses
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold">Units</h1>
              <p className="text-muted-foreground">
                {selectedCourse
                  ? `Manage units for ${selectedCourse.title}`
                  : "Manage your units and their order"}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground">
              {courseIdParam
                ? "No units found for this course. Create one to get started."
                : "No units found. Create one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DraggableList
          items={units}
          onReorder={handleReorder}
          renderItem={(unit) => {
            const unitCourse = courses.find((c) => c.id === unit.courseId);
            return (
              <Card className="flex-1">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{unit.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {unit.description}
                        </p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Order: {unit.order}</span>
                          {unitCourse && (
                            <span>Course: {unitCourse.title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/lessons?unitId=${unit.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(unit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unit.id)}
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
        title={editingUnit ? "Edit Unit" : "Create Unit"}
        description={
          editingUnit
            ? "Update the unit details"
            : "Add a new unit to your platform"
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
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!courseIdParam}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem
                          key={course.id}
                          value={course.id.toString()}
                        >
                          {course.title}
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
                    <Input placeholder="e.g., Unit 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Learn the basics of Spanish"
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

