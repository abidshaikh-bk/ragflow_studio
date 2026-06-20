type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur">
      <div className="max-w-xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-aqua">
          Empty state
        </p>
        <h2 className="font-heading text-2xl font-semibold text-ice-white">
          {title}
        </h2>
        <p className="text-sm leading-7 text-slate-300">{description}</p>
        {action ? <div className="pt-3">{action}</div> : null}
      </div>
    </section>
  );
}
