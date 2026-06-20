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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
      <div className="space-y-2">
        <Badge tone="info">MVP</Badge>
        <p className="text-sm text-slate-300">
          Provider choices and model names are editable now. Secrets stay masked after save.
        </p>
        {message ? (
          <p aria-live="polite" className="text-sm text-emerald" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <Button loading={isSaving} type="submit" variant="secondary">
        Save changes
      </Button>
    </div>
  );
}
