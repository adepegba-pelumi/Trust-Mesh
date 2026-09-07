import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function EmptyState({ title, description, icon, loading, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {loading ? (
        <div
          aria-hidden
          className="mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#EAEAEC] border-t-[#111111]"
        />
      ) : icon ? (
        <div className="mb-3 text-[#9CA3AF]">{icon}</div>
      ) : null}
      {title ? <p className="text-sm font-medium text-[#111111]">{title}</p> : null}
      <p className={cn("text-sm italic text-[#9CA3AF]", title && "mt-1")}>{description}</p>
    </div>
  );
}
