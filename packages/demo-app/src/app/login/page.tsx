"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const fieldClass =
  "h-10 border-[#EAEAEC] bg-white text-[#111111] placeholder:text-[#9CA3AF] focus-visible:ring-[#111111]/20";

function mapLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for a confirmation link.";
  }
  return message || "Unable to sign in. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapLoginError(signInError.message));
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-[#6E6E76]" htmlFor="email">
          Email
        </label>
        <Input
          autoComplete="email"
          className={fieldClass}
          id="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-1.5">
        <label
          className="text-xs font-medium uppercase tracking-wide text-[#6E6E76]"
          htmlFor="password"
        >
          Password
        </label>
        <Input
          autoComplete="current-password"
          className={fieldClass}
          id="password"
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[#6E6E76]">
        No account?{" "}
        <Link className="font-medium text-[#111111] underline-offset-4 hover:underline" href="/signup">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <PageShell>
      <AppNav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6E6E76]">account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111111]">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6E76]">
          Authenticate to access the TrustMesh live demo dashboard. Connect MetaMask separately after
          you sign in.
        </p>
        <Suspense
          fallback={<div className="mt-8 h-40 animate-pulse rounded-xl bg-[#F7F7F8]" aria-hidden />}
        >
          <LoginForm />
        </Suspense>
      </main>
    </PageShell>
  );
}
