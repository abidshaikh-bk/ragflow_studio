"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

const supportedExtensions = [".pdf", ".txt", ".docx", ".md"];

type DocumentDropzoneProps = {
  activeFileName?: string;
  isUploading?: boolean;
  onFileAccepted: (file: File) => Promise<void> | void;
  onPreviewFailure: () => void;
  statusMessage?: string;
};

export function DocumentDropzone({
  activeFileName,
  isUploading = false,
  onFileAccepted,
  onPreviewFailure,
  statusMessage
}: DocumentDropzoneProps) {
  const [error, setError] = useState("");
  const supportedText = supportedExtensions.join(", ");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isSupported = supportedExtensions.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!isSupported) {
      setError(`Unsupported file type. Use ${supportedText}.`);
      event.target.value = "";
      return;
    }

    setError("");
    onFileAccepted(file);
    event.target.value = "";
  }

  return (
    <Card
      eyebrow="Upload"
      title="Drop your source files"
      description="TXT and Markdown are the first MVP priority, with PDF and DOCX scaffolded into the interface."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-aqua/40 bg-aqua/5 px-6 py-14 text-center transition hover:border-aqua/70">
        <span className="font-heading text-xl text-ice-white">Upload documents</span>
        <span className="mt-2 max-w-sm text-sm leading-7 text-slate-300">
          Drag a file here or choose one from disk. Supported types: {supportedText}.
        </span>
        <input
          accept={supportedExtensions.join(",")}
          aria-label="Upload document"
          className="sr-only"
          onChange={handleChange}
          type="file"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={onPreviewFailure} type="button" variant="ghost">
          Preview failed state
        </Button>
        <p className="text-sm text-slate-300">
          {statusMessage
            ? statusMessage
            : isUploading && activeFileName
              ? `Uploading ${activeFileName} through the mock ingestion pipeline.`
              : "Upload a document to send it to private S3 storage before the processing pipeline continues."}
        </p>
      </div>
      {activeFileName ? (
        <p className="mt-4 text-sm text-emerald">Selected document: {activeFileName}</p>
      ) : null}
      {error ? (
        <div className="mt-4">
          <ErrorAlert message={error} title="Upload blocked" />
        </div>
      ) : null}
    </Card>
  );
}
