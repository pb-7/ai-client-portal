"use client";

import { useActionState } from "react";

import type { ClientPagePasswordState } from "@/types/publication";

type PasswordAction = (
  state: ClientPagePasswordState,
  formData: FormData,
) => Promise<ClientPagePasswordState>;

export function ClientPagePasswordForm({ action }: { action: PasswordAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="client-page-password" className="text-sm font-bold text-black/70">
          Page password
        </label>
        <input
          id="client-page-password"
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        />
      </div>
      {state.message ? (
        <p role="alert" className="text-sm leading-6 text-brand-red">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-md bg-brand-red px-5 text-sm font-bold text-white transition hover:bg-[#a90d27] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying…" : "View client page"}
      </button>
    </form>
  );
}
