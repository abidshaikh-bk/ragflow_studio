import { AuthCard } from "@/components/auth/AuthCard";
import { NetworkBackground } from "@/components/auth/NetworkBackground";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <NetworkBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <AuthCard
          description="Start querying private documents in a guided MVP workspace."
          footer={<>Returning users can sign in instead of creating a fresh account.</>}
          title="Create your workspace"
        >
          <RegisterForm />
        </AuthCard>
      </div>
    </main>
  );
}
