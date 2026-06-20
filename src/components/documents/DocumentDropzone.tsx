"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

const supportedExtensions = [".pdf", ".txt", ".docx", ".md"];

export function DocumentDropzone() {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const supportedText = useMemo(() => supportedExtensions.join(", "), []);

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
      setFileName("");
      return;
    }

    setError("");
    setFileName(file.name);
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
          aria-label="Upload document"
          className="sr-only"
          onChange={handleChange}
          type="file"
        />
      </label>
      {fileName ? (
        <p className="mt-4 text-sm text-emerald">Ready to process: {fileName}</p>
      ) : null}
      {error ? <div className="mt-4"><ErrorAlert message={error} title="Upload blocked" /></div> : null}
    </Card>
  );
}
