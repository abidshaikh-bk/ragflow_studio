import { AuthCard } from "@/components/auth/AuthCard";
import { NetworkBackground } from "@/components/auth/NetworkBackground";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <NetworkBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <AuthCard
          description="Create an account to turn your files into a trusted, searchable workspace."
          footer={
            <p>
              Already have an account?{" "}
              <Link
                className="text-aqua transition hover:text-ice-white"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          }
          title="Create your workspace"
        >
          <RegisterForm />
        </AuthCard>
      </div>
    </main>
  );
}
