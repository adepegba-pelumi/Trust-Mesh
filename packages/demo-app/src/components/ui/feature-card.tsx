import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { iconBox, surfaceCard, surfaceCardHover } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type IconBoxProps = {
  icon: LucideIcon;
  className?: string;
};

export function IconBox({ icon: Icon, className }: IconBoxProps) {
  return (
    <div className={cn(iconBox, className)}>
      <Icon className="h-5 w-5" aria-hidden />
    </div>
  );
}

type FeatureCardProps = {
  icon?: LucideIcon;
  title: string;
  body: string;
  tag?: string;
  className?: string;
  footer?: ReactNode;
};

export function FeatureCard({ icon: Icon, title, body, tag, className, footer }: FeatureCardProps) {
  return (
    <div className={cn("group flex flex-col justify-between p-7", surfaceCard, surfaceCardHover, className)}>
      <div>
        {tag ? (
          <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-500">{tag}</span>
        ) : null}
        {Icon ? <IconBox className={tag ? "mt-4" : undefined} icon={Icon} /> : null}
        <h3 className={cn("text-base font-semibold text-zinc-100", Icon || tag ? "mt-5" : "mt-0")}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      </div>
      {footer}
    </div>
  );
}
