# MVP Architecture

## System overview

This take-home is a single Next.js application deployed to Vercel, with Supabase providing PostgreSQL and email/password authentication for internal users. The authenticated application roles are admin and advisor. One household/client record represents one client, and each client is assigned to exactly one advisor for the MVP. Supabase Row Level Security (RLS) is the authoritative authorization boundary for the authenticated application.

Clients are not application users. A published client page is shared through a client-specific URL protected by a password gate that is separate from advisor/admin Supabase authentication.

The advisor portal, multi-client management, and publication workflow are implementation enhancements beyond the assessment minimum. The assessment requires an AI-generated branded webpage, a live deployment, and a password gate; it does not require a reusable multi-user portal.

Only fictional assessment data will be stored. Local development and production are the only assessment environments, using separate configuration. A distinct staging deployment and Supabase project are recommended for a real production system but are outside the assessment scope. Vercel and Supabase free tiers are the deployment targets.

## User roles

- **Admin:** The initial system has one admin. The admin can view all advisors and clients and reassign clients between advisors.
- **Advisor:** The initial system has three advisors. Advisors can create and edit client records, manage structured client inputs, initiate client-page generation, and review, preview, and publish pages only for clients assigned to them.
- **Client:** Not an authenticated application role. Clients receive no application account and access only a password-gated published page at a client-specific URL.

Access is derived from the authenticated profile and the client row's advisor assignment rather than from a role or client identifier supplied by the browser. Disabled admin or advisor users must lose application access. Each client has exactly one advisor in the MVP; a many-to-many assignment model is a future option and must not be implemented for the assessment MVP.

## Main user flows

### Advisor

1. Sign in with an advisor account.
2. Create or edit an assigned client record.
3. Enter or update structured, fictional client inputs.
4. Initiate an AI-generated narrative draft.
5. Review and preview the complete branded result with its required disclosure.
6. Publish the approved narrative for the client.

### Admin

1. Sign in with the admin account.
2. View all advisors and clients.
3. Reassign a client from one advisor to another.

### Client page access

1. An advisor shares the published client-specific URL and its page password through an appropriate channel.
2. The client submits the page password through a gate separate from Supabase Auth.
3. After successful validation, the client can view only that client's published page; no application account or Supabase Auth session is created.

### Account administration

1. The admin provisions advisor accounts; there is no public registration.
2. An admin disables an internal account when access must be revoked.
3. Authorization checks deny the disabled admin or advisor access even if an existing session has not yet expired.
4. Admins and advisors can use the supported password-reset flow. MFA is outside the assessment MVP and is a future production enhancement.

## Proposed database tables

| Table | Purpose |
| --- | --- |
| `profiles` | Internal application profile linked one-to-one with a Supabase Auth user; stores the admin/advisor role and disabled status. |
| `clients` | Client record, non-sensitive fictional assessment details, and the required single advisor assignment. |
| `client_inputs` | Structured fictional inputs used to generate a client narrative. |
| `narratives` | Narrative lifecycle record, including draft/published status and publication metadata. |
| `narrative_versions` | Immutable generated narrative versions, structured JSON output, model metadata, and review metadata. |
| `client_page_access` | Client-specific page identifier and password-gate state, separate from internal Supabase Auth accounts. |

Authentication credentials for admins and advisors remain in Supabase Auth and are not duplicated in application tables. Clients have no Auth users. All client-owned tables include a non-null client identifier. The client-page access mechanism is modeled separately from application authentication and must store no plaintext page password. A production implementation should also include append-only audit events; for the assessment, lifecycle timestamps and reviewer/publisher identifiers provide the minimum traceability.

The existing migration implements the superseded admin/client role and membership model. A follow-up migration must convert it to admin/advisor roles and enforce one advisor per client before the admin portal is built. Supporting multiple advisors per client later would justify a dedicated many-to-many assignment table; that flexibility is intentionally deferred.

## Authentication and authorization

- Supabase Auth provides email/password sign-in and password reset.
- Public registration is disabled. Admin-controlled workflows provision advisor accounts; clients never receive application accounts.
- Server-side operations validate the authenticated user, active profile, role, and client assignment.
- RLS is enabled on every application table and is the final authorization authority for authenticated reads and writes.
- Advisor policies permit access only to clients assigned to the current advisor and their related records.
- Admin policies permit access to all advisors and clients, including client reassignment.
- Disabled status is checked by RLS or an RLS-accessible authorization function so disabling an account revokes data access independently of UI and route guards.
- Supabase service-role credentials remain server-only and are limited to operations that cannot safely run in the user's authorization context.
- Client-page access uses a separate server-validated password gate and does not grant a Supabase authenticated application session. Its password must never be stored in plaintext or exposed to browser code.

Route protection and server-side role checks improve usability and defense in depth, but they do not replace RLS.

## AI generation lifecycle

1. The assigned advisor saves validated, structured client inputs.
2. A server-only action or API route loads authorized inputs and calls the AI provider. No provider credentials or AI calls are exposed to the browser.
3. The model receives structured inputs and is required to return validated JSON narrative fields.
4. The server rejects output that does not match the expected schema and stores a new draft version with generation metadata.
5. The advisor reviews the draft.
6. The advisor previews the complete client page.
7. The advisor explicitly publishes an approved version.
8. The client can access only the published version through the client-specific password gate.

The required workflow remains **Generate Draft → Review → Preview → Publish**.

Branding, labels, layout, and the required disclosure are deterministic application content. They are never requested from, editable by, or generated by the model.

## Security decisions

- Store fictional assessment data only; do not use real client or financial information.
- Treat RLS policies as application security controls and test tenant isolation directly.
- Keep Supabase service-role and AI provider keys on the server.
- Validate all mutations and AI inputs/outputs against explicit schemas.
- Derive identity, role, and client assignment from the authenticated session and database; never trust browser-supplied authorization claims.
- Prevent disabled accounts from accessing data even with an existing session.
- Require explicit human review and preview before narrative publication.
- Keep the client-page password/access mechanism separate from Supabase authentication, validate it server-side, and store only a strong password hash.
- Avoid placing client inputs, generated narratives, credentials, or tokens in application logs.
- Use secure Vercel environment variables for production secrets and local environment files for development secrets.
- Treat MFA as a future production enhancement outside the assessment MVP.
- Use separate local and production data/configuration. Add a fully isolated staging environment for a real production deployment.

## Implementation sequence

1. Add a follow-up migration that replaces the existing admin/client role and membership assumptions with admin/advisor roles and one required advisor assignment per client.
2. Update and verify RLS for admin-wide access, advisor assignment isolation, unauthenticated denial, and disabled-user behavior.
3. Adapt the existing authentication foundation for admin/advisor role-aware routing.
4. Implement admin advisor visibility and client reassignment.
5. Implement advisor-scoped client creation, editing, and structured inputs.
6. Implement server-only structured AI generation, schema validation, version storage, and the **Generate Draft → Review → Preview → Publish** lifecycle.
7. Implement the separate client-specific URL and password gate for published pages.
8. Document production hardening steps, including MFA, staging isolation, expanded audit logging, stronger session controls, and optional future multi-advisor assignments.
9. Complete end-to-end authorization and page-access verification, deploy to Vercel and Supabase free tiers, and document staging as the next production-hardening step.
