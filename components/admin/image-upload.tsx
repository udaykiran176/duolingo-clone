"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { Upload, Loader2, Copy, Clipboard } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function ImageUpload({
  value,
  onChange,
  folder = "/uploads/",
  disabled = false,
  label = "Image",
  placeholder = "e.g., /images/hello.png",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Authenticates and retrieves the necessary upload credentials from the server.
   */
  const authenticator = async () => {
    try {
      const response = await fetch("/api/upload-auth");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
      const data = (await response.json()) as {
        signature: string;
        expire: number;
        token: string;
        publicKey: string;
      };
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  /**
   * Handles the file upload process.
   */
  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // Create new AbortController for this upload
    abortControllerRef.current = new AbortController();

    try {
      // Get authentication parameters
      const authParams = await authenticator();
      const { signature, expire, token, publicKey } = authParams as {
        signature: string;
        expire: number;
        token: string;
        publicKey: string;
      };

      // Upload the file
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        folder: folder.trim() || "/uploads/",
        useUniqueFileName: true,
        onProgress: (event) => {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(percentComplete);
        },
        abortSignal: abortControllerRef.current.signal,
      });

      if (uploadResponse.url) {
        onChange(uploadResponse.url);
        toast.success("Image uploaded successfully!");
      }

      setProgress(100);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ImageKitAbortError) {
        toast.error("Upload was cancelled");
      } else if (error instanceof ImageKitInvalidRequestError) {
        toast.error(`Invalid request: ${error.message}`);
      } else if (error instanceof ImageKitUploadNetworkError) {
        toast.error(`Network error: ${error.message}`);
      } else if (error instanceof ImageKitServerError) {
        toast.error(`Server error: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);
      }
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [folder, onChange]);

  /**
   * Handles file selection from input.
   */
  const handleFileSelect = () => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    void handleUpload(file);
  };

  /**
   * Sets up paste event listener.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    // Handler for paste events
    const pasteHandler = (e: ClipboardEvent) => {
      // Only handle if not typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Find image in clipboard items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) return;

          // Validate file size (max 10MB)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            toast.error("Pasted image size must be less than 10MB");
            return;
          }

          void handleUpload(file);
          setIsPasteMode(false);
          break;
        }
      }
    };

    // Handler for keydown events to show paste hint
    const keydownHandler = (e: KeyboardEvent) => {
      // Show hint when Ctrl+V or Cmd+V is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        setIsPasteMode(true);
        setTimeout(() => setIsPasteMode(false), 2000);
      }
    };

    // Add event listeners
    container.addEventListener("paste", pasteHandler);
    container.addEventListener("keydown", keydownHandler);

    return () => {
      container.removeEventListener("paste", pasteHandler);
      container.removeEventListener("keydown", keydownHandler);
    };
  }, [disabled, folder, handleUpload]);

  /**
   * Copies the image URL to clipboard.
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <Label>{label}</Label>
      
      {/* Paste Hint */}
      {isPasteMode && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Clipboard className="h-3 w-3" />
          <span>Press Ctrl+V (or Cmd+V on Mac) to paste an image</span>
        </div>
      )}

      {/* URL Input and Upload Button */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
          id={`image-upload-${Math.random()}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void copyToClipboard(value);
            }}
            disabled={disabled}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Image Preview */}
      {value && !isUploading && (
        <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-md border">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enter URL manually, click upload button, or paste image (Ctrl+V)
      </p>
    </div>
  );
}

