type ProgressProps = {
  label: string;
  value: number;
  max?: number;
};

export function Progress({ label, max = 100, value }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-xs text-aqua">{Math.round(percentage)}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet via-aqua to-blue-glow transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
