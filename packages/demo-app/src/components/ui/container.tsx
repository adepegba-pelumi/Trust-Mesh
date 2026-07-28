import type { ReactNode } from "react";

import { pageContainer } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
};

export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return <Tag className={cn(pageContainer, className)}>{children}</Tag>;
}
