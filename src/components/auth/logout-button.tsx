"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Unable to sign out right now. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-md bg-brand-red px-5 font-bold text-white transition hover:bg-[#a90d27] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-brand-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
