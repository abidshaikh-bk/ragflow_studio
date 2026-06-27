import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function SaveBar({
  isSaving,
  message
}: {
  isSaving?: boolean;
  message?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,18,34,0.94),rgba(7,12,24,0.92))] px-5 py-5 shadow-glow">
      <div className="space-y-2">
        <Badge tone="info">Models & embeddings</Badge>
        <p className="text-sm text-slate-300">
          Save provider changes for both cards at once. Stored secrets remain masked
          after save and continue living server-side.
        </p>
        {message ? (
          <p aria-live="polite" className="text-sm text-emerald" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <Button loading={isSaving} type="submit">
        Save changes
      </Button>
    </div>
  );
}
