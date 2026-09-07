import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111]/15 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#111111] text-white",
        secondary: "border-[#EAEAEC] bg-white text-[#6E6E76]",
        destructive: "border-[#EF4444]/30 bg-[#FEF2F2] text-[#EF4444]",
        outline: "border-[#EAEAEC] bg-white text-[#111111]",
        success: "border-transparent bg-[#EAFBF1] text-[#16A34A]",
        warning: "border-[#EAEAEC] bg-white text-[#6E6E76]",
        network: "border-[#111111] bg-white text-[#111111]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
