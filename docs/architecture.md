# MVP Architecture

## System overview

This take-home is a single Next.js application deployed to Vercel, with Supabase providing PostgreSQL and email/password authentication. One household/client record represents one tenant. Access to tenant data is granted through memberships, and Supabase Row Level Security (RLS) is the authoritative authorization boundary.

Only fictional assessment data will be stored. Local development and production are the only assessment environments, using separate configuration. A distinct staging deployment and Supabase project are recommended for a real production system but are outside the assessment scope. Vercel and Supabase free tiers are the deployment targets.

## User roles

- **Admin:** Creates and manages client households and accounts, edits structured client inputs, generates and reviews narrative drafts, and publishes approved narratives.
- **Client:** Signs in to view only the published narrative and information associated with household memberships.

Access is determined by active memberships rather than by trusting a role or tenant identifier supplied by the browser. Disabled users must lose access.

## Main user flows

### Admin

1. Sign in with an admin account.
2. Create or edit a household/client tenant.
3. Create a client account and assign its household membership; there is no public registration.
4. Enter or update structured, fictional client inputs.
5. Request an AI-generated narrative draft.
6. Review and preview the complete branded result with its required disclosure.
7. Publish the approved narrative for the client.

### Client

1. Sign in with email and password.
2. Reset a forgotten password through the supported recovery flow when needed.
3. View only the published narrative for an authorized household.

### Account administration

1. An admin disables an account when access must be revoked.
2. Authorization checks deny the disabled user access even if an existing session has not yet expired.
3. MFA is not part of the assessment MVP. In a production deployment, I would require MFA for administrative accounts and consider it for client accounts based on the organization’s security policy.

## Proposed database tables

| Table | Purpose |
| --- | --- |
| `profiles` | Application profile linked one-to-one with a Supabase Auth user; stores role and disabled status. |
| `clients` | Household/client tenant record and non-sensitive fictional assessment details. |
| `memberships` | Links profiles to clients and defines which tenants a user may access. |
| `client_inputs` | Structured fictional inputs used to generate a client narrative. |
| `narratives` | Narrative lifecycle record, including draft/published status and publication metadata. |
| `narrative_versions` | Immutable generated narrative versions, structured JSON output, model metadata, and review metadata. |

Authentication credentials remain in Supabase Auth and are not duplicated in application tables. All tenant-owned tables include a non-null client identifier. A production implementation should also include append-only audit events; for the assessment, lifecycle timestamps and reviewer/publisher identifiers provide the minimum traceability.

## Authentication and authorization

- Supabase Auth provides email/password sign-in and password reset.
- Public registration is disabled. Admin-controlled workflows create client accounts and memberships.
- Server-side operations validate the authenticated user, active profile, role, and relevant membership.
- RLS is enabled on every tenant-owned table and is the final authorization authority for reads and writes.
- Client policies allow access only through an active membership and only to published client-facing data.
- Admin policies permit the administrative operations required by the MVP.
- Disabled status is checked by RLS or an RLS-accessible authorization function so disabling an account revokes data access independently of UI and route guards.
- Supabase service-role credentials remain server-only and are limited to operations that cannot safely run in the user's authorization context.

Route protection and server-side role checks improve usability and defense in depth, but they do not replace RLS.

## AI generation lifecycle

1. The admin saves validated, structured client inputs.
2. A server-only action or API route loads authorized inputs and calls the AI provider. No provider credentials or AI calls are exposed to the browser.
3. The model receives structured inputs and is required to return validated JSON narrative fields.
4. The server rejects output that does not match the expected schema and stores a new draft version with generation metadata.
5. The admin reviews and previews the draft.
6. The admin explicitly publishes an approved version.
7. The client can access only the published version.

Branding, labels, layout, and the required disclosure are deterministic application content. They are never requested from, editable by, or generated by the model.

## Security decisions

- Store fictional assessment data only; do not use real client or financial information.
- Treat RLS policies as application security controls and test tenant isolation directly.
- Keep Supabase service-role and AI provider keys on the server.
- Validate all mutations and AI inputs/outputs against explicit schemas.
- Derive identity, role, and tenant access from the authenticated session and database; never trust browser-supplied authorization claims.
- Prevent disabled accounts from accessing data even with an existing session.
- Require explicit admin review before narrative publication.
- Avoid placing client inputs, generated narratives, credentials, or tokens in application logs.
- Use secure Vercel environment variables for production secrets and local environment files for development secrets.
- Plan MFA from the start and require it for admins if it fits within the assessment deadline.
- Use separate local and production data/configuration. Add a fully isolated staging environment for a real production deployment.

## Implementation sequence

1. Define Supabase migrations for profiles, clients, memberships, inputs, narratives, and narrative versions.
2. Add RLS policies and verify admin, client, cross-tenant, unauthenticated, and disabled-user behavior.
3. Add validated Supabase browser/server utilities and environment configuration.
4. Implement email/password login, logout, password reset, protected routing, and disabled-account handling.
5. Implement admin client creation, account provisioning, membership assignment, and client editing.
6. Implement the client-facing published narrative view.
7. Implement server-only structured AI generation, schema validation, version storage, admin preview, and publication.
8. Document production hardening steps, including MFA for admin accounts, staging isolation, expanded audit logging, and stronger session controls.
9. Complete end-to-end verification, deploy to Vercel and Supabase free tiers, and document staging as the next production-hardening step.
