"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/fetcher";

interface Props {
  projectId: string;
  photoCount: number;
  onUploaded: () => void;
}

const MAX_PHOTOS = 30;

async function readImageSize(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

export function PhotoUploader({ projectId, photoCount, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList) {
    const remaining = MAX_PHOTOS - photoCount;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      setError(`This project already has the maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      for (const [i, file] of selected.entries()) {
        setProgress(`Uploading ${i + 1} of ${selected.length}…`);

        // Presign, PUT straight to R2, then register the row — keeps large
        // bodies out of the API route entirely.
        const { uploadUrl, storageKey } = await postJson<{ uploadUrl: string; storageKey: string }>(
          "/api/uploads/presign",
          { kind: "photo", projectId, filename: file.name, contentType: file.type }
        );

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload failed for ${file.name}`);

        const { width, height } = await readImageSize(file);
        await postJson(`/api/projects/${projectId}/photos`, {
          storageKey,
          width,
          height,
          fileSizeBytes: file.size,
        });
      }
      onUploaded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={uploading || photoCount >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Add photos"}
        </Button>
        <span className="text-xs text-neutral-500">
          {photoCount}/{MAX_PHOTOS} photos · 10–30 recommended
        </span>
      </div>
      {progress ? <p className="text-xs text-neutral-500">{progress}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
