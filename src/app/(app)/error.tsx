"use client";

import { ErrorAlert } from "@/components/ui/ErrorAlert";

type ProtectedErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({
  error,
  reset
}: ProtectedErrorProps) {
  return (
    <div className="mx-auto flex min-h-[360px] max-w-2xl items-center">
      <div className="w-full space-y-4">
        <ErrorAlert
          message={error.message || "The protected workspace failed to render."}
          title="Workspace error"
        />
        <button
          className="rounded-full bg-violet px-4 py-2 text-sm font-medium text-white transition hover:bg-violet/90"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
