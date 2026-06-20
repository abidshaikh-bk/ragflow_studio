export function UserMenu() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua/15 font-mono text-xs uppercase text-aqua">
        RS
      </div>
      <div className="hidden sm:block">
        <p className="text-sm text-ice-white">Workspace user</p>
        <p className="text-xs text-slate-400">Auth placeholder</p>
      </div>
      <button
        className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 transition hover:border-aqua/50 hover:text-aqua"
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
