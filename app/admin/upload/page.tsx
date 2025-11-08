"use client";

import { useState, useRef, useEffect } from "react";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { Upload, X, Check, Loader2, Copy, Clipboard } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function AdminUploadPage() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    fileId: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState("/uploads/");
  const [fileName, setFileName] = useState("");
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

      // Use custom fileName if provided, otherwise use original file name
      const finalFileName = fileName.trim() || file.name;

      // Upload the file
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: finalFileName,
        folder: folder.trim() || "/uploads/",
        useUniqueFileName: !fileName.trim(), // Use unique name only if no custom name provided
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
      setFileName("");
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
    // Auto-fill fileName if empty
    if (fileInputRef.current?.files?.[0] && !fileName) {
      setFileName(fileInputRef.current.files[0].name);
    }
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

  /**
   * Sets up paste event listener.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

          // Determine file extension from MIME type if filename is missing
          let fileExtension = 'png';
          if (file.name && file.name.includes('.')) {
            fileExtension = file.name.split('.').pop() || 'png';
          } else {
            // Try to determine extension from MIME type
            const mimeType = item.type;
            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
              fileExtension = 'jpg';
            } else if (mimeType.includes('png')) {
              fileExtension = 'png';
            } else if (mimeType.includes('gif')) {
              fileExtension = 'gif';
            } else if (mimeType.includes('webp')) {
              fileExtension = 'webp';
            }
          }

          // Create a data transfer object to set the file in the input
          const dataTransfer = new DataTransfer();
          
          // Create a proper File object with a name if it doesn't have one
          const fileWithName = file.name 
            ? file 
            : new File([file], `pasted-image.${fileExtension}`, { type: file.type });
          
          dataTransfer.items.add(fileWithName);
          
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            
            // Auto-fill filename if empty - use functional update to get latest state
            setFileName((currentFileName) => {
              if (!currentFileName) {
                // Generate a filename with timestamp
                const timestamp = new Date().getTime();
                return `pasted-image-${timestamp}.${fileExtension}`;
              }
              return currentFileName;
            });

            toast.success("Image pasted! Click upload to continue.");
            setIsPasteMode(false);
            
            // Trigger change event
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
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

    // Make container focusable to receive paste events
    container.setAttribute("tabIndex", "-1");
    
    // Focus the container when component mounts to enable paste
    // Use setTimeout to ensure it happens after render
    setTimeout(() => {
      container.focus();
    }, 100);

    return () => {
      container.removeEventListener("paste", pasteHandler);
      container.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="container mx-auto max-w-4xl py-8 px-4 outline-none focus:outline-none"
      onFocus={() => containerRef.current?.focus()}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Upload Image</CardTitle>
          <CardDescription className="flex items-center gap-2">
            Upload images to ImageKit. Supported formats: JPG, PNG, GIF, WebP, etc.
            Maximum file size: 10MB
            <span className="mx-2">•</span>
            <span className="flex items-center gap-1 text-xs">
              <Clipboard className="h-3 w-3" />
              Paste image (Ctrl+V)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paste Hint */}
          {isPasteMode && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span>Press Ctrl+V (or Cmd+V on Mac) to paste an image</span>
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file-input">Select Image File or Paste from Clipboard</Label>
            <Input
              id="file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              You can select a file or paste an image from your clipboard using Ctrl+V (Cmd+V on Mac)
            </p>
          </div>

          {/* Folder Input */}
          <div className="space-y-2">
            <Label htmlFor="folder-input">Folder Path (optional)</Label>
            <Input
              id="folder-input"
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="/uploads/"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Folder path where the image will be stored. Default: /uploads/
            </p>
          </div>

          {/* File Name Input */}
          <div className="space-y-2">
            <Label htmlFor="filename-input">Custom File Name (optional)</Label>
            <Input
              id="filename-input"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Leave empty to use original filename with unique suffix"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              If empty, a unique filename will be generated automatically
            </p>
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
                  <p className="text-sm font-medium">File ID:</p>
                  <p className="text-sm text-muted-foreground font-mono">{uploadedFile.fileId}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Image URL:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      readOnly
                      value={uploadedFile.url}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void copyToClipboard(uploadedFile.url);
                      }}
                    >
                      <Copy className="h-4 w-4" />
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

