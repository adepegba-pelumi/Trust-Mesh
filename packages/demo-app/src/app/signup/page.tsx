"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const fieldClass =
  "h-10 border-[#EAEAEC] bg-white text-[#111111] placeholder:text-[#9CA3AF] focus-visible:ring-[#111111]/20";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters (Supabase minimum).");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmation is required, session is null until the user confirms.
      if (!data.session) {
        setNeedsConfirmation(true);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error during signup.");
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="mt-8 rounded-xl border border-[#EAEAEC] bg-[#EAFBF1] p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" aria-hidden />
          <div>
            <p className="font-semibold text-[#111111]">Check your email</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6E6E76]">
              We sent a confirmation link to <span className="font-medium text-[#111111]">{email}</span>.
              Confirm your address, then{" "}
              <Link className="underline-offset-4 hover:underline" href="/login">
                sign in
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          autoComplete="new-password"
          className={fieldClass}
          id="password"
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
        <p className="text-xs text-[#9CA3AF]">At least 6 characters (Supabase default minimum).</p>
      </div>

      <div className="space-y-1.5">
        <label
          className="text-xs font-medium uppercase tracking-wide text-[#6E6E76]"
          htmlFor="confirm-password"
        >
          Confirm password
        </label>
        <Input
          autoComplete="new-password"
          className={fieldClass}
          id="confirm-password"
          minLength={6}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-[#6E6E76]">
        Already have an account?{" "}
        <Link className="font-medium text-[#111111] underline-offset-4 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <PageShell>
      <AppNav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6E6E76]">account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111111]">Create account</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6E76]">
          Sign up with email to access the dashboard. Wallet connection stays optional and separate.
        </p>
        <SignupForm />
      </main>
    </PageShell>
  );
}
