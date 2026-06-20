import { Spinner } from "@/components/ui/Spinner";

export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <Spinner label="Loading workspace" size="lg" />
    </div>
  );
}
