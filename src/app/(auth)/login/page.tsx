import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { NetworkBackground } from "@/components/auth/NetworkBackground";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <NetworkBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <AuthCard
          description="Sign in to ask grounded questions across your private documents."
          footer={
            <p>
              New here?{" "}
              <Link
                className="text-aqua transition hover:text-ice-white"
                href="/register"
              >
                Create account
              </Link>
            </p>
          }
          title="Welcome back"
        >
          <LoginForm />
        </AuthCard>
      </div>
    </main>
  );
}
