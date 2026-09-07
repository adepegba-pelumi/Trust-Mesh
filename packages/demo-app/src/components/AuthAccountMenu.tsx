"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthAccountMenuProps = {
  email: string;
  className?: string;
  compact?: boolean;
};

/** Logged-in account indicator + logout only. */
export function AuthAccountMenu({ email, className, compact = false }: AuthAccountMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "max-w-[10rem] truncate rounded-full border border-[#EAEAEC] px-2.5 py-1 text-xs text-[#6E6E76]",
          compact && "max-w-full",
        )}
        title={email}
      >
        {email}
      </span>
      <Button
        disabled={loggingOut}
        onClick={() => void handleLogout()}
        size="sm"
        type="button"
        variant="outline"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {loggingOut ? "Signing out…" : "Logout"}
      </Button>
    </div>
  );
}
