type SpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]"
};

export function Spinner({
  label = "Loading",
  size = "md"
}: SpinnerProps) {
  return (
    <div
      aria-label={label}
      aria-live="polite"
      className="inline-flex items-center gap-3 text-sm text-slate-300"
      role="status"
    >
      <span
        className={`inline-block animate-spin rounded-full border-aqua border-t-transparent ${sizeClasses[size]}`}
      />
      <span>{label}</span>
    </div>
  );
}
