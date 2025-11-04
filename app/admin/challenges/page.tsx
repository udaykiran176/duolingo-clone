"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ArrowLeft,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormDialog } from "@/components/admin/form-dialog";
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
import { Breadcrumb } from "@/components/admin/breadcrumb";
import { DraggableList } from "@/components/admin/draggable-list";

const challengeSchema = z.object({
  lessonId: z.string().min(1, "Lesson is required"),
  type: z.enum(["SELECT", "ASSIST"], { required_error: "Type is required" }),
  question: z.string().min(1, "Question is required"),
});

const optionSchema = z.object({
  text: z.string().min(1, "Text is required"),
  correct: z.boolean(),
  imageSrc: z.string().optional(),
  audioSrc: z.string().optional(),
});

type Challenge = {
  id: number;
  lessonId: number;
  type: "SELECT" | "ASSIST";
  question: string;
  order: number;
};

type ChallengeOption = {
  id: number;
  challengeId: number;
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
};

type Lesson = {
  id: number;
  title: string;
  unitId: number;
  order: number;
};

type ChallengeFormData = z.infer<typeof challengeSchema>;
type OptionFormData = z.infer<typeof optionSchema>;

async function fetchChallenges(lessonId?: string): Promise<Challenge[]> {
  const url = lessonId ? `/api/challenges?lessonId=${lessonId}` : "/api/challenges";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch challenges");
  return res.json();
}

async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch("/api/lessons");
  if (!res.ok) throw new Error("Failed to fetch lessons");
  return res.json();
}

async function fetchOptions(challengeId: number): Promise<ChallengeOption[]> {
  const res = await fetch(`/api/challenge-options?challengeId=${challengeId}`);
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
}

async function createChallenge(data: ChallengeFormData): Promise<Challenge> {
  const res = await fetch("/api/challenges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create challenge" }));
    throw new Error(error.error || "Failed to create challenge");
  }
  return res.json();
}

async function updateChallenge(
  id: number,
  data: ChallengeFormData
): Promise<Challenge> {
  const res = await fetch(`/api/challenges/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update challenge" }));
    throw new Error(error.error || "Failed to update challenge");
  }
  return res.json();
}

async function deleteChallenge(id: number): Promise<void> {
  const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete challenge");
}

async function reorderChallenges(items: { id: number; order: number }[]): Promise<void> {
  const res = await fetch("/api/challenges/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to reorder challenges" }));
    throw new Error(error.error || error.details || "Failed to reorder challenges");
  }
}

async function createOption(
  challengeId: number,
  data: OptionFormData
): Promise<ChallengeOption> {
  const res = await fetch("/api/challenge-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId, ...data }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create option" }));
    throw new Error(error.error || "Failed to create option");
  }
  return res.json();
}

async function updateOption(
  id: number,
  data: Partial<OptionFormData>
): Promise<ChallengeOption> {
  const res = await fetch(`/api/challenge-options/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update option" }));
    throw new Error(error.error || "Failed to update option");
  }
  return res.json();
}

async function deleteOption(id: number): Promise<void> {
  const res = await fetch(`/api/challenge-options/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete option");
}

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editingOption, setEditingOption] = useState<ChallengeOption | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [expandedChallenge, setExpandedChallenge] = useState<number | null>(null);

  const challengeForm = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      lessonId: lessonIdParam || "",
      type: "SELECT",
      question: "",
    },
  });

  const optionForm = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      text: "",
      correct: false,
      imageSrc: "",
      audioSrc: "",
    },
  });

  useEffect(() => {
    if (lessonIdParam) {
      challengeForm.setValue("lessonId", lessonIdParam);
    }
  }, [lessonIdParam, challengeForm]);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges", lessonIdParam],
    queryFn: () => fetchChallenges(lessonIdParam || undefined),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons"],
    queryFn: fetchLessons,
  });

  const { data: options = [] } = useQuery({
    queryKey: ["options", expandedChallenge],
    queryFn: () => fetchOptions(expandedChallenge!),
    enabled: !!expandedChallenge,
  });

  const createMutation = useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge created successfully");
      setIsDialogOpen(false);
      challengeForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create challenge");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChallengeFormData }) =>
      updateChallenge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge updated successfully");
      setIsDialogOpen(false);
      setEditingChallenge(null);
      challengeForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update challenge");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete challenge");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderChallenges,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenges reordered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder challenges");
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: ({ challengeId, data }: { challengeId: number; data: OptionFormData }) =>
      createOption(challengeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success("Option created successfully");
      setIsOptionDialogOpen(false);
      optionForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create option");
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OptionFormData> }) =>
      updateOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success("Option updated successfully");
      setIsOptionDialogOpen(false);
      setEditingOption(null);
      optionForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update option");
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: deleteOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success("Option deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete option");
    },
  });

  const handleOpenDialog = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      challengeForm.reset({
        lessonId: challenge.lessonId.toString(),
        type: challenge.type,
        question: challenge.question,
      });
    } else {
      setEditingChallenge(null);
      challengeForm.reset({
        lessonId: lessonIdParam || "",
        type: "SELECT",
        question: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmitChallenge = (data: ChallengeFormData) => {
    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenOptionDialog = (challengeId: number, option?: ChallengeOption) => {
    setSelectedChallengeId(challengeId);
    if (option) {
      setEditingOption(option);
      optionForm.reset({
        text: option.text,
        correct: option.correct,
        imageSrc: option.imageSrc || "",
        audioSrc: option.audioSrc || "",
      });
    } else {
      setEditingOption(null);
      optionForm.reset({
        text: "",
        correct: false,
        imageSrc: "",
        audioSrc: "",
      });
    }
    setIsOptionDialogOpen(true);
  };

  const handleSubmitOption = (data: OptionFormData) => {
    if (!selectedChallengeId) return;

    if (editingOption) {
      updateOptionMutation.mutate({ id: editingOption.id, data });
    } else {
      createOptionMutation.mutate({ challengeId: selectedChallengeId, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this challenge?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteOption = (id: number) => {
    if (confirm("Are you sure you want to delete this option?")) {
      deleteOptionMutation.mutate(id);
    }
  };

  const handleReorder = (newItems: Challenge[]) => {
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    reorderMutation.mutate(itemsWithOrder);
  };

  const selectedLesson = lessons.find((l) => l.id.toString() === lessonIdParam);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: "Units", href: "/admin/units" },
            { label: "Lessons", href: "/admin/lessons" },
            { label: "Challenges" },
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
              { label: "Units", href: "/admin/units" },
              {
                label: selectedLesson ? `Lessons - ${selectedLesson.title}` : "Lessons",
                href: selectedLesson
                  ? `/admin/lessons?unitId=${selectedLesson.unitId}`
                  : "/admin/lessons",
              },
              {
                label: selectedLesson
                  ? `${selectedLesson.title} - Challenges`
                  : "Challenges",
              },
            ]}
          />
          <div className="mt-2 flex items-center gap-4">
            {lessonIdParam && (
              <Link href={`/admin/lessons?unitId=${selectedLesson?.unitId || ""}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Lessons
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold">Challenges</h1>
              <p className="text-muted-foreground">
                {selectedLesson
                  ? `Manage challenges for ${selectedLesson.title}`
                  : "Manage your challenges and their options"}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Challenge
        </Button>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-muted-foreground">
              {lessonIdParam
                ? "No challenges found for this lesson. Create one to get started."
                : "No challenges found. Create one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DraggableList
          items={challenges}
          onReorder={handleReorder}
          renderItem={(challenge) => {
            const isExpanded = expandedChallenge === challenge.id;
            const challengeOptions = isExpanded ? options : [];

            return (
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedChallenge(
                              isExpanded ? null : challenge.id
                            )
                          }
                        >
                          {isExpanded ? "▼" : "▶"}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{challenge.question}</h3>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {challenge.type}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Order: {challenge.order}
                          </p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Options</h4>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleOpenOptionDialog(challenge.id)
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Option
                            </Button>
                          </div>

                          {challengeOptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No options yet. Add one to get started.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {challengeOptions.map((option) => (
                                <Card key={option.id}>
                                  <CardContent className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      {option.correct ? (
                                        <Check className="h-5 w-5 text-orange-500" />
                                      ) : (
                                        <X className="h-5 w-5 text-gray-400" />
                                      )}
                                      <div>
                                        <p className="font-medium">{option.text}</p>
                                        {(option.imageSrc || option.audioSrc) && (
                                          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                                            {option.imageSrc && (
                                              <span>Image: {option.imageSrc}</span>
                                            )}
                                            {option.audioSrc && (
                                              <span>Audio: {option.audioSrc}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleOpenOptionDialog(
                                            challenge.id,
                                            option
                                          )
                                        }
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteOption(option.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(challenge)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(challenge.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }}
        />
      )}

      {/* Challenge Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingChallenge ? "Edit Challenge" : "Create Challenge"}
        description={
          editingChallenge
            ? "Update the challenge details"
            : "Add a new challenge to your lesson"
        }
        onSubmit={challengeForm.handleSubmit(handleSubmitChallenge)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form {...challengeForm}>
          <div className="space-y-4 py-4">
            <FormField
              control={challengeForm.control}
              name="lessonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!lessonIdParam}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lesson" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id.toString()}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={challengeForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select challenge type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SELECT">SELECT</SelectItem>
                      <SelectItem value="ASSIST">ASSIST</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={challengeForm.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., What is the Spanish word for 'hello'?"
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

      {/* Option Dialog */}
      <FormDialog
        open={isOptionDialogOpen}
        onOpenChange={setIsOptionDialogOpen}
        title={editingOption ? "Edit Option" : "Create Option"}
        description={
          editingOption
            ? "Update the option details"
            : "Add a new option to this challenge"
        }
        onSubmit={optionForm.handleSubmit(handleSubmitOption)}
        isLoading={
          createOptionMutation.isPending || updateOptionMutation.isPending
        }
      >
        <Form {...optionForm}>
          <div className="space-y-4 py-4">
            <FormField
              control={optionForm.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hola" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={optionForm.control}
              name="correct"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Correct Answer</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={optionForm.control}
              name="imageSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Source (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., /images/hello.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={optionForm.control}
              name="audioSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio Source (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., /audio/hello.mp3" {...field} />
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

