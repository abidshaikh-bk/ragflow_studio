"use client";

type SystemPromptEditorProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function SystemPromptEditor({
  disabled = false,
  onChange,
  value
}: SystemPromptEditorProps) {
  return (
    <label className="flex flex-col gap-2" htmlFor="shared-system-prompt">
      <span className="text-sm font-medium text-ice-white">System prompt</span>
      <textarea
        aria-label="System prompt"
        className="min-h-48 rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-ice-white outline-none transition placeholder:text-slate-500 focus-visible:border-aqua/70 focus-visible:ring-2 focus-visible:ring-aqua/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        id="shared-system-prompt"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Guide the shared assistant’s tone, answer style, and guardrails."
        value={value}
      />
      <span className="text-xs text-slate-400">
        Applied to every chat turn before the assistant sees user or tool context.
      </span>
    </label>
  );
}
