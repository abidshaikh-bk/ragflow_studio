import { TopNav } from "./TopNav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-hero-grid bg-grid">
      <TopNav />
      <main className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-7xl px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-glow backdrop-blur">
          {children}
        </div>
      </main>
    </div>
  );
}
