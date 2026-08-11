# Fake Financial Firm Client Portal

A production-oriented AI Engineer take-home built as one Next.js application.
Internal admin and advisor users authenticate with Supabase, manage fictional
client records, save structured financial inputs, generate and review Claude
narratives, and publish client-specific password-protected pages.

All client information is fictional assessment data.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, and ESLint
- Supabase Auth, PostgreSQL, and Row Level Security
- Anthropic Claude
- Vercel deployment target
- pnpm and Node.js 22

## Local setup

1. Use Node.js 22 and install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `CLIENT_PAGE_DATA_ACCESS_SECRET` (at least 32 random characters)
   - `CLIENT_PAGE_SESSION_SECRET` (at least 32 random characters)
3. Apply the Supabase migrations in `supabase/migrations` in filename order.
4. Run `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

The two client-page secrets must be different, server-only values. Never commit
`.env.local`.

## Production configuration

Add the five environment variables above to Vercel. In Supabase Auth URL
Configuration, set the Site URL to the production origin and allow:

```text
https://your-production-domain.example/auth/callback
http://localhost:3000/auth/callback
```

Add explicitly scoped Vercel preview callback URLs only if password reset will
be tested on preview deployments. Public registration must remain disabled.

## Checks

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Architecture and security decisions are documented in
[`docs/architecture.md`](docs/architecture.md).
