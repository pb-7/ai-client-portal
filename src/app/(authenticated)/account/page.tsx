import { LogoutButton } from "@/components/auth/logout-button";

export default function AccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 py-12 text-brand-black">
      <section className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-[0_24px_70px_rgba(26,26,26,0.08)] sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
          Secure access
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Authentication is working
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-black/60">
          Your session is active. The admin and client experiences will be
          added in later implementation tickets.
        </p>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
