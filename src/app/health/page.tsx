export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let connected = false;

  if (supabaseUrl && publishableKey) {
    try {
      const response = await fetch(new URL("/auth/v1/health", supabaseUrl), {
        cache: "no-store",
        headers: {
          apikey: publishableKey,
        },
        signal: AbortSignal.timeout(5_000),
      });

      connected = response.ok;
    } catch {
      connected = false;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-brand-black">
      <section
        className="w-full max-w-2xl rounded-lg border border-black/10 p-8"
        aria-labelledby="health-heading"
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
          Connection health
        </p>
        <h1 id="health-heading" className="mt-3 text-3xl font-bold">
          Supabase
        </h1>
        <p
          className={`mt-5 text-lg ${connected ? "text-green-700" : "text-brand-red"}`}
          role="status"
        >
          {connected
            ? "Supabase connection successful"
            : "Supabase connection failed. Please check the server configuration and try again."}
        </p>
      </section>
    </main>
  );
}
