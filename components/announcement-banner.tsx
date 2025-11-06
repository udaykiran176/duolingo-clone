"use client";

import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";

type Announcement = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isActive: boolean;
  createdAt: string;
};

async function fetchAnnouncement(): Promise<{ announcement: Announcement | null }> {
  const response = await fetch("/api/announcements");
  if (!response.ok) {
    throw new Error("Failed to fetch announcement");
  }
  return (await response.json()) as { announcement: Announcement | null };
}

export function AnnouncementBanner() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["announcement"],
    queryFn: fetchAnnouncement,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1,
  });

  useEffect(() => {
    // Check localStorage for dismissed banner
    if (data?.announcement) {
      const dismissedId = localStorage.getItem("dismissed-announcement-id");
      if (dismissedId && data.announcement.id.toString() === dismissedId) {
        setIsHidden(true);
        return;
      } else {
        setIsHidden(false);
      }
    }

    // Auto-hide on scroll, show when at top
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data]);

  const handleClose = () => {
    if (data?.announcement) {
      localStorage.setItem(
        "dismissed-announcement-id",
        data.announcement.id.toString()
      );
      setIsHidden(true);
    }
  };

  const announcement = data?.announcement;

  // Don't render if loading, no announcement, hidden, or scrolled
  if (isLoading) {
    return null; // Loading state - don't show anything
  }

  if (error) {
    console.error("Announcement banner error:", error);
    return null;
  }

  if (!announcement) {
    // No active announcement in database
    return null;
  }

  if (isHidden) {
    return null;
  }

  // Hide banner when scrolled down
  if (isScrolled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed left-0 top-0 z-50 w-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 shadow-lg"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4">
          <div className="flex flex-1 flex-wrap items-center justify-center gap-2 text-sm font-medium text-white sm:gap-3 sm:text-base">
            <span className="text-lg">🎉</span>
            <span className="font-bold">{announcement.title}</span>
            <span className="hidden sm:inline">{announcement.message}</span>
            <span className="sm:hidden">{announcement.message.length > 30 ? `${announcement.message.substring(0, 30)}...` : announcement.message}</span>
            {announcement.link && (
              <Link
                href={announcement.link}
                className="ml-2 rounded-md bg-white/20 px-3 py-1 font-semibold transition-all hover:bg-white/30 hover:underline"
              >
                Learn More →
              </Link>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
            aria-label="Close banner"
          >
            <X className="h-5 w-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

