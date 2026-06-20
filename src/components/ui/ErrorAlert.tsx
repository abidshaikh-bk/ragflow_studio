type ErrorAlertProps = {
  title?: string;
  message: string;
};

export function ErrorAlert({
  title = "Something went wrong",
  message
}: ErrorAlertProps) {
  return (
    <div
      aria-live="assertive"
      className="rounded-2xl border border-magenta/40 bg-magenta/10 p-4 text-sm text-ice-white"
      role="alert"
    >
      <p className="font-medium text-magenta">{title}</p>
      <p className="mt-2 leading-6 text-slate-200">{message}</p>
    </div>
  );
}
