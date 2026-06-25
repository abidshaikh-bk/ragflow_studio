import { TopNav } from "./TopNav";

type AppShellProps = {
  children: React.ReactNode;
  isAdmin?: boolean;
  userEmail?: string;
};

export function AppShell({ children, isAdmin = false, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-hero-grid bg-grid text-ice-white">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_right,rgba(124,58,237,0.18),transparent_28%)]">
        <TopNav isAdmin={isAdmin} userEmail={userEmail} />
        <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[88rem] px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
          <div className="flex w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-glow backdrop-blur-xl">
            <div className="max-h-[calc(100vh-8.5rem)] w-full overflow-y-auto overflow-x-hidden">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:gap-8 lg:px-8 lg:py-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
