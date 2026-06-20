import { TopNav } from "./TopNav";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-hero-grid bg-grid">
      <TopNav userEmail={userEmail} />
      <main className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-7xl px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-glow backdrop-blur">
          {children}
        </div>
      </main>
    </div>
  );
}
