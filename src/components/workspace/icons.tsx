import type { ReactElement, SVGProps } from "react";
import { cn } from "@/lib/utils";

type WorkspaceIconName =
  | "chevronLeft"
  | "chevronRight"
  | "documents"
  | "library"
  | "menu"
  | "messages"
  | "plus"
  | "sparkles"
  | "upload";

type WorkspaceIconProps = SVGProps<SVGSVGElement> & {
  name: WorkspaceIconName;
};

const iconPaths: Record<WorkspaceIconName, ReactElement> = {
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  documents: (
    <>
      <path d="M8 3.75h6.5L19.25 8.5V19a1.75 1.75 0 0 1-1.75 1.75h-9A1.75 1.75 0 0 1 6.75 19V5.5A1.75 1.75 0 0 1 8.5 3.75Z" />
      <path d="M14 3.75V8.5h4.75" />
      <path d="M9.5 12.25h5" />
      <path d="M9.5 15.5h5" />
    </>
  ),
  library: (
    <>
      <path d="M4.75 6.75A1.75 1.75 0 0 1 6.5 5h11A1.75 1.75 0 0 1 19.25 6.75v10.5A1.75 1.75 0 0 1 17.5 19h-11a1.75 1.75 0 0 1-1.75-1.75Z" />
      <path d="M8.5 8.75v6.5" />
      <path d="M12 8.75v6.5" />
      <path d="M15.5 8.75v6.5" />
    </>
  ),
  menu: (
    <>
      <path d="M4.75 7.25h14.5" />
      <path d="M4.75 12h14.5" />
      <path d="M4.75 16.75h14.5" />
    </>
  ),
  messages: (
    <>
      <path d="M6.75 6.5A1.75 1.75 0 0 1 8.5 4.75h7A1.75 1.75 0 0 1 17.25 6.5v5A1.75 1.75 0 0 1 15.5 13.25h-4l-3.75 3v-3H8.5A1.75 1.75 0 0 1 6.75 11.5Z" />
      <path d="M9.5 8.5h5" />
      <path d="M9.5 10.75h3.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.25v13.5" />
      <path d="M5.25 12h13.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 4.75 1.6 4.65L18.25 11l-4.65 1.6L12 17.25l-1.6-4.65L5.75 11l4.65-1.6Z" />
      <path d="m18.25 4.75.55 1.55 1.55.55-1.55.55-.55 1.55-.55-1.55-1.55-.55 1.55-.55Z" />
      <path d="m4.75 14.75.55 1.55 1.55.55-1.55.55-.55 1.55-.55-1.55-1.55-.55 1.55-.55Z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.75V7.25" />
      <path d="m8.75 10.5 3.25-3.25 3.25 3.25" />
      <path d="M5.75 18.25h12.5" />
    </>
  )
};

export function WorkspaceIcon({
  className,
  name,
  ...props
}: WorkspaceIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
