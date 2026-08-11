"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  accountUnavailable: boolean;
  invalidResetLink: boolean;
};

export function LoginForm({
  accountUnavailable,
  invalidResetLink,
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    invalidResetLink
      ? "This password reset link is invalid or expired. Request a new one."
      : accountUnavailable
        ? "This account is not available. Contact your administrator."
        : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Unable to sign in. Check your email and password.");
        return;
      }

      router.replace("/portal");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-bold text-black/70">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="password"
            className="text-sm font-bold text-black/70"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-bold text-brand-red hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        />
      </div>

      {error ? (
        <p id="login-error" role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center rounded-md bg-brand-red px-5 font-bold text-white transition hover:bg-[#a90d27] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
