import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function SaveBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
      <div className="space-y-2">
        <Badge tone="info">MVP</Badge>
        <p className="text-sm text-slate-300">
          Settings editing is deferred until the auth and server settings APIs are ready.
        </p>
      </div>
      <Button disabled variant="secondary">
        Save changes
      </Button>
    </div>
  );
}
