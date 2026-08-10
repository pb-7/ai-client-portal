export default function Home() {
  return (
    <main className="min-h-screen bg-white text-brand-black">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-black/10 pb-6">
          <a href="#" className="flex items-center gap-3" aria-label="Fake Financial Firm home">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-red text-sm font-bold tracking-tight text-white">
              FF
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.16em] sm:text-base">
              Fake Financial Firm
            </span>
          </a>
          <span className="hidden text-sm text-black/60 sm:block">Client Portal</span>
        </header>

        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-24 lg:py-20">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-brand-red">
              Clear advice. Confident decisions.
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-7xl">
              Your financial picture, in one secure place.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/65 sm:text-xl">
              A simple portal for clients to review personalized insights and stay connected with their advisory team.
            </p>
            <div className="mt-10 flex items-center gap-4 text-sm text-black/55">
              <span className="h-px w-10 bg-brand-red" aria-hidden="true" />
              Built around clarity, privacy, and personal service.
            </div>
          </div>

          <section className="rounded-2xl border border-black/10 bg-[#fafafa] p-7 shadow-[0_24px_70px_rgba(26,26,26,0.08)] sm:p-10" aria-labelledby="portal-heading">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">Client access</p>
            <h2 id="portal-heading" className="mt-3 text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-3 leading-7 text-black/60">The secure client portal is coming soon.</p>

            <div className="mt-8 space-y-5" aria-hidden="true">
              <div>
                <div className="mb-2 text-sm font-bold text-black/70">Email address</div>
                <div className="h-12 rounded-md border border-black/15 bg-white" />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-black/70">Password</div>
                <div className="h-12 rounded-md border border-black/15 bg-white" />
              </div>
              <div className="flex h-12 items-center justify-center rounded-md bg-brand-red font-bold text-white opacity-60">
                Sign in
              </div>
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-black/50">
              Sign-in functionality is not yet available.
            </p>
          </section>
        </section>

        <footer className="border-t border-black/10 pt-6 text-xs leading-5 text-black/55 sm:flex sm:items-start sm:justify-between sm:gap-8">
          <p>© {new Date().getFullYear()} Fake Financial Firm. All rights reserved.</p>
          <p className="mt-3 max-w-2xl sm:mt-0 sm:text-right">
            For demonstration purposes only. This website does not provide investment, tax, or legal advice.
          </p>
        </footer>
      </div>
    </main>
  );
}
