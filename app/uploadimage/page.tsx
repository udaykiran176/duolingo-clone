"use client";

import { useState, useRef } from "react";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { Upload, X, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function UploadImagePage() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    fileId: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const handleUpload = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    const file = fileInput.files[0];
    
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
    setError(null);
    setUploadedFile(null);

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
        folder: "/uploads/",
        useUniqueFileName: true,
        onProgress: (event) => {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(percentComplete);
        },
        abortSignal: abortControllerRef.current.signal,
      });

      const url = uploadResponse.url as string;
      const fileId = uploadResponse.fileId as string;
      const name = uploadResponse.name as string;

      if (!url || !fileId || !name) {
        throw new Error("Upload response is missing required fields");
      }

      setUploadedFile({
        url,
        fileId,
        name,
      });
      toast.success("Image uploaded successfully!");
      setProgress(100);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof ImageKitAbortError) {
        setError("Upload was cancelled");
        toast.error("Upload was cancelled");
      } else if (error instanceof ImageKitInvalidRequestError) {
        setError(`Invalid request: ${error.message}`);
        toast.error(`Invalid request: ${error.message}`);
      } else if (error instanceof ImageKitUploadNetworkError) {
        setError(`Network error: ${error.message}`);
        toast.error(`Network error: ${error.message}`);
      } else if (error instanceof ImageKitServerError) {
        setError(`Server error: ${error.message}`);
        toast.error(`Server error: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setError(errorMessage);
        toast.error(errorMessage);
      }
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Cancels the current upload.
   */
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setProgress(0);
      toast.info("Upload cancelled");
    }
  };

  /**
   * Handles file selection.
   */
  const handleFileChange = () => {
    setError(null);
    setUploadedFile(null);
    setProgress(0);
  };

  /**
   * Copies the uploaded image URL to clipboard.
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
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Upload Image</CardTitle>
          <CardDescription>
            Upload images to ImageKit. Supported formats: JPG, PNG, GIF, WebP, etc.
            Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <label htmlFor="file-input" className="text-sm font-medium">
              Select Image File
            </label>
            <div className="flex items-center gap-4">
              <input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                void handleUpload();
              }}
              disabled={isUploading || !fileInputRef.current?.files?.length}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
            {isUploading && (
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={!isUploading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Upload Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Upload Success */}
          {uploadedFile && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  Upload Successful!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">File Name:</p>
                  <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Image URL:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={uploadedFile.url}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void copyToClipboard(uploadedFile.url);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <Image
                      src={uploadedFile.url}
                      alt={uploadedFile.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

