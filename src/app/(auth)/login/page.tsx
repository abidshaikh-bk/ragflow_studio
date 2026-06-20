import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { NetworkBackground } from "@/components/auth/NetworkBackground";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <NetworkBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <AuthCard
          description="Welcome back to your document intelligence workspace."
          footer={<>Use the registration flow to create a new MVP workspace.</>}
          title="Welcome back"
        >
          <LoginForm />
        </AuthCard>
      </div>
    </main>
  );
}
