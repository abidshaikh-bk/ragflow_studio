import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Session = {
  id: string;
  title: string;
  updatedAt: string;
  active?: boolean;
};

type SessionListProps = {
  sessions: Session[];
};

export function SessionList({ sessions }: SessionListProps) {
  return (
    <Card
      className="h-full"
      eyebrow="Sessions"
      title="Recent chats"
      action={<Button size="sm">New chat</Button>}
    >
      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
              session.active
                ? "border-aqua/40 bg-aqua/10"
                : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
            }`}
            key={session.id}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-ice-white">{session.title}</p>
              {session.active ? <Badge tone="info">Live</Badge> : null}
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              {session.updatedAt}
            </p>
          </button>
        ))}
      </div>
    </Card>
  );
}
