# AI Generation Workflow

## AI-generated page artifact

ChatGPT was used to generate a standalone branded HTML page from the supplied
simulated John and Jane Doe assessment data as an explicit demonstration of the
assessment-required AI page-generation step. The resulting artifact is
preserved at [`docs/initial-ai-generated-page.html`](initial-ai-generated-page.html).

The artifact demonstrates the assessment-required AI generation step by
combining:

- Fake Financial Firm branding
- Client-specific factual and narrative content
- A responsive webpage concept
- The required legal disclosure

It is retained as a documentation and development reference. It is not imported
into the Next.js application, exposed through an application route, or deployed
separately. It provides evidence and a reference showing how ChatGPT can
transform the supplied simulated data and brand requirements into a complete
branded HTML page. This repository does not claim that the artifact influenced
the earlier production implementation or was refactored line-by-line into it.

## Deterministic production template

The production client page uses a reusable Next.js template. Application code,
not a language model, deterministically controls:

- Fake Financial Firm branding
- Arial typography and the red, black, and white color system
- Page structure, layout, headings, and labels
- Display of factual client values
- The required legal disclosure

The disclosure is stored as fixed application content and is rendered verbatim.
It is never requested from, summarized by, or rewritten by Claude.

This separation keeps branding, layout, factual presentation, and disclosure
identical across advisors and client households. At scale, it also reduces
model variability, prevents generated content from becoming authorization or
compliance logic, and makes the client-facing output easier to validate,
review, and maintain.

## Production Claude narrative workflow

Claude is used server-side to generate only personalized narrative sections
from validated structured client data:

1. An authorized advisor or administrator saves structured client inputs.
2. The server reloads and revalidates the stored `client_inputs` JSON.
3. A server-only prompt builder treats all advisor-entered content as untrusted
   data rather than instructions.
4. Claude returns structured narrative fields:
   - `retirementSummary`
   - `consolidationSummary`
   - `portfolioSummary`
   - `nextSteps`
5. The server validates the response against the expected narrative schema.
6. The generated draft is stored as an immutable narrative version.
7. An advisor reviews and may edit the draft.
8. The reviewed content is stored as another immutable version.
9. Publishing pins the client page to a specific reviewed version.

The final client page combines:

```text
Validated factual database values
+ approved Claude narrative
+ deterministic branding and layout
+ fixed required disclosure
```

## Factual-data boundary

AI-generated factual values are not trusted. Ages, assets, state, goals, risk
profile, portfolio allocations, and other factual financial values come
directly from validated structured database records. Claude is instructed not
to invent facts or overwrite the structured source of truth.

AI output also has no authority over authentication, advisor ownership, tenant
isolation, Row Level Security, publication access, password protection,
branding, or disclosure text.

## Example initial page-generation prompt

The following concise example represents the type of prompt used to produce the
initial John and Jane Doe page artifact from the supplied simulated assessment
data:

```text
Create a responsive branded client-review webpage for the fictional financial
advisory firm Fake Financial Firm.

Client household:
- John Doe and Jane Doe
- Current ages: 54 and 52
- Target retirement age: 62
- Assets currently with the firm: $1.25 million
- Outside assets: approximately $480,000
- Residence: Missouri
- Risk profile: moderate growth
- Goals: retire at age 62, fund approximately $90,000 of remaining college
  costs for two children over four years, and leave a modest legacy
- Portfolio allocation: 45% US equity, 18% international equity, 27% fixed
  income, 6% cash/short-term, and 4% alternatives
- Review focus: retirement progress and possible consolidation of outside
  assets

Requirements:
- Use Fake Financial Firm branding.
- Use Arial typography.
- Use #C8102E for the primary red, #1A1A1A for black, and white backgrounds.
- Present the supplied client facts clearly and do not invent additional facts.
- Include concise retirement, consolidation, goals, portfolio, and next-step
  sections.
- Keep the tone professional and avoid projections, guarantees, or unsupported
  recommendations.
- Produce responsive semantic HTML.
- Include the following disclosure exactly and do not rewrite it:

This material is provided for informational purposes only and does not
constitute investment, tax, or legal advice. Figures shown are illustrative and
based on information believed to be accurate as of the meeting date. Investing
involves risk, including the possible loss of principal. Past performance is not
a guarantee of future results. This page is intended solely for the named client
and should not be forwarded or redistributed. Fake Financial Firm —
Confidential.
```

The production application does not send this full page-generation prompt to
Claude. Its server-side Claude request is intentionally narrower: Claude
receives validated structured inputs and returns narrative JSON only, while the
application renders the final page deterministically.
