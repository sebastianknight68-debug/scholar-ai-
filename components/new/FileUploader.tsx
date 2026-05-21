"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  FileText,
  FileType2,
  ImageIcon,
  Presentation,
  Mic,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn, truncate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { SourceType } from "@/lib/types";

const ACCEPT =
  ".pdf,.docx,.pptx,.mp3,.wav,.m4a,.mp4,.jpg,.jpeg,.png,.webp,audio/*,image/*";

type UploadItem = {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  type: SourceType;
  text?: string;
};

function classify(file: File): SourceType {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("audio") || /\.(mp3|wav|m4a|mp4|webm)$/.test(name))
    return "audio";
  if (file.type.startsWith("image") || /\.(jpe?g|png|webp|heic)$/.test(name))
    return "image";
  if (/\.pdf$/.test(name)) return "pdf";
  if (/\.docx$/.test(name)) return "docx";
  if (/\.pptx$/.test(name)) return "pptx";
  return "text";
}

function IconFor({ type }: { type: SourceType }) {
  const Map: Record<SourceType, React.ComponentType<{ className?: string }>> = {
    audio: Mic,
    pdf: FileText,
    docx: FileType2,
    pptx: Presentation,
    image: ImageIcon,
    text: FileText,
  };
  const I = Map[type];
  return <I className="h-4 w-4 text-primary-soft" />;
}

export function FileUploader({
  onParsed,
}: {
  onParsed: (item: {
    type: SourceType;
    text: string;
    filename: string;
  }) => void;
}) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const newItems: UploadItem[] = arr.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: "pending",
      progress: 0,
      type: classify(file),
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach(upload);
  }

  async function upload(item: UploadItem) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: "uploading", progress: 5 } : i,
      ),
    );
    try {
      const endpoint =
        item.type === "audio" ? "/api/transcribe" : "/api/parse-file";

      const text = await uploadWithProgress(endpoint, item.file, (pct) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, progress: Math.max(i.progress, pct) } : i,
          ),
        );
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "done", progress: 100, text } : i,
        ),
      );
      onParsed({ type: item.type, text, filename: item.file.name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: msg } : i,
        ),
      );
      toast({
        title: "Couldn't parse " + item.file.name,
        description: msg,
        variant: "danger",
      });
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Upload files</h3>
          <p className="text-xs text-muted">
            PDFs, DOCX, PPTX, audio, or photos of handwritten notes.
          </p>
        </div>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg/40 px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-cardElevated/40",
          dragging && "border-primary/60 bg-primary/5",
        )}
      >
        <UploadCloud className="h-8 w-8 text-primary-soft" />
        <p className="text-sm font-medium">
          Drag and drop, or <span className="text-primary-soft">browse</span>
        </p>
        <p className="text-xs text-muted">Multiple files supported</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-bg/40 px-3 py-2"
            >
              <IconFor type={i.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{truncate(i.file.name, 48)}</span>
                  <span className="text-xs text-muted">
                    {(i.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="mt-1.5">
                  <Progress value={i.progress} />
                </div>
              </div>
              <div className="w-6 text-right">
                {i.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                )}
                {i.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
                {i.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-danger" />
                )}
                {i.status === "pending" && (
                  <button onClick={() => removeItem(i.id)} title="Remove">
                    <X className="h-4 w-4 text-muted hover:text-white" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// XHR-based upload so we can show real progress.
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file, file.name);
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve((data.text as string) ?? "");
        } else {
          reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Bad server response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}
