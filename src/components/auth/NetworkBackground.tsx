export function NetworkBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
    >
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-aqua/15 blur-3xl" />
      <div className="absolute right-10 top-1/3 h-60 w-60 rounded-full bg-violet/15 blur-3xl" />
      <div className="absolute left-8 bottom-16 h-52 w-52 rounded-full bg-magenta/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/30 to-transparent" />
      <div className="absolute left-[18%] top-[28%] h-3 w-3 rounded-full bg-aqua shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
      <div className="absolute left-[48%] top-[42%] h-3 w-3 rounded-full bg-violet shadow-[0_0_20px_rgba(124,58,237,0.65)]" />
      <div className="absolute left-[62%] top-[24%] h-2 w-2 rounded-full bg-emerald shadow-[0_0_18px_rgba(16,185,129,0.55)]" />
    </div>
  );
}
