"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Breadcrumb } from "@/components/admin/breadcrumb";
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

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  link: z.string().url("Invalid URL").optional().or(z.literal("")),
  // Keep as required boolean; provide default via useForm.defaultValues
  isActive: z.boolean(),
});

type Announcement = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isActive: boolean;
  createdAt: string;
};

type AnnouncementFormData = z.infer<typeof announcementSchema>;

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements/admin");
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return (await res.json()) as Announcement[];
}

async function createAnnouncement(data: AnnouncementFormData): Promise<Announcement> {
  const res = await fetch("/api/announcements/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to create announcement");
  }
  return (await res.json()) as Announcement;
}

async function updateAnnouncement(
  id: number,
  data: AnnouncementFormData
): Promise<Announcement> {
  const res = await fetch(`/api/announcements/admin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = (await res.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to update announcement");
  }
  return (await res.json()) as Announcement;
}

async function deleteAnnouncement(id: number): Promise<void> {
  const res = await fetch(`/api/announcements/admin/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = (await res.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to delete announcement");
  }
}

async function toggleAnnouncementActive(
  id: number,
  isActive: boolean
): Promise<Announcement> {
  const res = await fetch(`/api/announcements/admin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const error = (await res.json()) as { error?: string };
    throw new Error(error.error ?? "Failed to toggle announcement");
  }
  return (await res.json()) as Announcement;
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      link: "",
      isActive: true,
    },
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["announcement"] });
      toast.success("Announcement created successfully");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create announcement");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AnnouncementFormData }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["announcement"] });
      toast.success("Announcement updated successfully");
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update announcement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["announcement"] });
      toast.success("Announcement deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete announcement");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleAnnouncementActive(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["announcement"] });
      toast.success("Announcement status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to toggle announcement");
    },
  });

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      form.reset({
        title: announcement.title,
        message: announcement.message,
        link: announcement.link || "",
        isActive: announcement.isActive,
      });
    } else {
      setEditingAnnouncement(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: AnnouncementFormData) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: number, currentStatus: boolean) => {
    toggleMutation.mutate({ id, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Announcements" }]} />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Announcements" }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No announcements found. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          announcement.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {announcement.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{announcement.message}</p>
                    {announcement.link && (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:underline"
                      >
                        {announcement.link}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(announcement.id, announcement.isActive)}
                      title={announcement.isActive ? "Deactivate" : "Activate"}
                    >
                      {announcement.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
        onSubmit={() => { void form.handleSubmit(handleSubmit)(); }}
        submitLabel={editingAnnouncement ? "Update" : "Create"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(handleSubmit)(e);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Offer!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="50% OFF on Premium SmartBit Courses."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/shop"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Show this announcement on the homepage
                    </p>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-5 w-5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Footer actions are controlled by FormDialog */}
          </form>
        </Form>
      </FormDialog>
    </div>
  );
}

