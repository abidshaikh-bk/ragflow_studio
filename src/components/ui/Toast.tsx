import { Badge } from "./Badge";

type ToastProps = {
  title: string;
  message: string;
  tone?: "info" | "success";
};

export function Toast({ message, title, tone = "info" }: ToastProps) {
  return (
    <div
      aria-label={`${title} ${message}`}
      aria-live="polite"
      className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-glow"
      role="status"
    >
      <div className="flex items-center gap-3">
        <Badge tone={tone === "success" ? "success" : "info"}>{tone}</Badge>
        <p className="font-medium text-ice-white">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
    </div>
  );
}
