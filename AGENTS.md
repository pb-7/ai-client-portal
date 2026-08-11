# Repository Engineering Context

Read this file before every implementation task. This repository is an AI Engineer take-home assessment for the fictional financial advisory firm **Fake Financial Firm**. All client data is fictional and exists only for this assessment.

Build a production-quality solution that satisfies the assessment while demonstrating sound engineering, AI integration, security, and architectural judgment. Do not reinterpret or expand explicit assessment requirements. Clearly distinguish required assessment functionality from implementation enhancements.

## Source-of-truth assessment requirements

These requirements come directly from the assessment and take precedence over implementation preferences. The final solution must:

- Use AI (Claude or ChatGPT) to generate the required branded webpage from the provided fictional client information.
- Deploy the application to a live public URL.
- Put a password gate in front of the live client page. Any approach that works on a free tier is acceptable, but the implementation must be able to explain where the password lives, the security tradeoffs, and what would be done differently for real client financial data in production.
- Apply Fake Financial Firm branding consistently.
- Include the required legal disclosure exactly as provided.
- Provide the complete GitHub repository.
- Include a short technical write-up covering architecture, implementation decisions, security considerations, AI consistency, and possible future improvements.

Everything below describes implementation choices intended to demonstrate production-quality engineering beyond the assessment minimum unless explicitly identified above.

## Implementation vision (enhancement)

This implementation intentionally expands the required password-protected webpage into a reusable AI-powered advisor portal. This is an implementation enhancement—not an additional assessment requirement—intended to demonstrate software engineering, AI engineering, security, scalability, maintainability, and production-oriented architecture.

Only internal application users authenticate through Supabase. The initial account model is one admin and three advisors:

- **Admin:** Can view all advisors and clients, manage the internal user model, and reassign clients between advisors.
- **Advisor:** Can view and manage only assigned clients, create and edit those client records and structured inputs, initiate client-page generation, review and preview drafts, and publish approved versions.
- **Client:** Is not an application user and receives no Supabase Auth account. A client accesses a published page through a client-specific URL protected by a separate password gate.

Each client is assigned to exactly one advisor for the assessment MVP. Future multi-advisor support may introduce a many-to-many assignment model, but must not be implemented for the MVP.

## Architecture

### AI lifecycle

```text
Structured client information
  → server-side prompt construction
  → LLM
  → structured AI output
  → validation
  → advisor review
  → preview
  → publish
  → client experience
```

- Treat AI output as a draft; require human approval before client-facing publication whenever practical.
- AI generates content, not security logic, authorization, branding, or disclosures.
- Keep branding, authorization, and required disclosure deterministic.
- Validate structured inputs and structured model output.
- Application security must never depend on AI output.
- All AI calls occur server-side.

### Authentication and authorization

Supabase is the authentication and database platform.

- No public registration.
- Admin-managed advisor accounts.
- Email/password authentication and password reset.
- Disabled accounts must lose access.
- Server-side authorization.
- Supabase Row Level Security (RLS) is the authoritative security boundary.
- Never trust authorization values supplied by the browser.
- Never expose service-role credentials.
- MFA is outside MVP scope; document it only as a future production enhancement.

MVP application-access model:

```text
Auth User → Profile (admin or advisor)
Advisor Profile ← Client assignment (exactly one advisor per client)
```

Admin policies permit access across advisors and clients. Advisor policies permit access only to clients assigned to the current advisor. The client-page password gate is separate from Supabase authentication and must not create a client application session.

### Planned data model

Expected core tables:

- `profiles`
- `clients`
- `client_inputs`
- `narratives`
- `narrative_versions`
- `client_page_access`

The target schema assigns each `clients` row to exactly one advisor profile and keeps client-page password access separate from application authentication. The existing migration still contains the earlier admin/client role and membership model and must be revised in a follow-up migration before the admin portal is built.

Authentication credentials remain in Supabase Auth.

### Technology stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Supabase RLS
- Vercel
- OpenAI and/or Anthropic APIs
- GitHub

## Branding and disclosure

- Name: Fake Financial Firm
- Primary red: `#C8102E`
- Black: `#1A1A1A`
- Background: white
- Typography: Arial

Branding must remain deterministic and reusable. Render the assessment-provided legal disclosure verbatim. Never ask an LLM to recreate, summarize, or rewrite it.

## Security principles

- Never commit secrets; `.env.local` remains local.
- Keep AI calls and service-role credentials server-side.
- Validate application inputs and AI output.
- Apply least privilege and use RLS for tenant isolation.
- Avoid sensitive information in logs.
- Store only fictional assessment data in this repository and its assessment environments.

## Engineering priorities

Optimize in this order:

1. Working assessment delivery
2. Correct security
3. Tenant isolation
4. AI integration
5. Maintainability
6. Scalability
7. Visual polish

Prefer simple architecture, production-quality code, strict TypeScript, reusable components, explicit validation, and small focused commits. Avoid unnecessary abstraction, frameworks, unrelated refactoring, over-engineering, and features outside the requested task.

## Development workflow

For every future task:

- Read this file before implementation.
- Implement only the requested feature; do not expand scope.
- Do not modify unrelated files.
- Explain important architectural decisions and distinguish assessment requirements from implementation enhancements.
- Highlight relevant security implications.
- Run lint and build checks after code changes.
- Keep changes reviewable.

## Current status

Completed:

- Next.js and branding foundations
- Architecture documentation
- Supabase packages and reusable client utilities
- Environment configuration
- Temporary connectivity verification
- Initial database schema and RLS foundation based on the earlier role/membership model
- Authentication foundation

Not yet implemented:

- Follow-up migration replacing the earlier client-user/membership model with admin/advisor roles and one-advisor-per-client assignment
- Admin dashboard
- Advisor management and client assignment
- Client management
- Separate client-page password gate
- AI generation workflow
- Review and publication workflow
- Deployment

## Expected final deliverables

- Live deployment
- Complete GitHub repository
- Login instructions
- Short technical write-up

<!-- BEGIN:nextjs-agent-rules -->

## Next.js version note

This Next.js version may contain APIs, conventions, and file structures that differ from prior versions. Before changing framework behavior, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

This block is maintained by Next.js tooling and may be re-added by `next dev`.

<!-- END:nextjs-agent-rules -->
