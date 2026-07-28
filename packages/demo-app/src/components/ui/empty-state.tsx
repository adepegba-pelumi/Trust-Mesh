import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function EmptyState({ title, description, icon, loading, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-8 text-center text-zinc-500",
        className,
      )}
      role={loading ? "status" : undefined}
      aria-live={loading ? "polite" : undefined}
    >
      {loading ? (
        <Loader2 className="mb-3 h-5 w-5 animate-spin text-emerald-400" aria-hidden />
      ) : icon ? (
        <div className="mb-3 text-zinc-600">{icon}</div>
      ) : null}
      {title ? <p className="text-sm font-medium text-zinc-400">{title}</p> : null}
      <p className={cn("text-sm", title && "mt-1")}>{description}</p>
    </div>
  );
}
