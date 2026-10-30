# GAAC by OAIC

A dependency-free, bilingual website based on the supplied OAIC V1.3 executive presentation and planning text. The supplied GAAC logo identifies the event; OAIC identifies the wider initiative.

## Preview

Run `npm run dev`, then open `http://localhost:4173`. All site files are in `dist/`; there is no build step. `npm run check` validates JavaScript syntax.

## Pages

- `/` — concise proposition, applications, audience paths, ecosystem overview
- `/challenge/` — format, shared hardware, application requirements, assessment, FAQ
- `/ecosystem/` — Testbed, collaboration loop, assets, five capabilities, 90-day plan
- `/partners/` — sponsorship/resource contributions, value, milestone reporting
- `/teams/` — team profile, delivery requirements, participant journey
- `/enterprise/` — adoption, deployments, training, and acceptance
- `/research/` — research questions, education, and collaboration units
- `/resources/` — original presentation download and detailed planning handbook
- `/involve/` — local-only collaboration brief composer with copy/download
- `/directions/` — actual screenshots, palettes, references, and three video prompts

## Design and language

Use `?design=cobalt`, `?design=acid`, or `?design=iris`. Use `&lang=en` or `&lang=zh`. Navigation preserves both values, and the browser remembers the selection when storage is available.

The design dock switches between Electric Cobalt, Acid Signal, and Sky Editorial. All palettes exclude orange. The original transparent logo is retained; the dark version uses CSS inversion. Direction 03 is now the selected default: sky blue (#8AE6FF), deep ink (#102C3A), porcelain (#F6FAFA), pale ice (#E4F5FA), and marine (#28667C). Headline fonts are self-hosted with their licenses; body type uses Google Fonts with system fallbacks. Add `&type=michroma` (default), `&type=unbounded`, or `&type=syncopate` to compare naturally extended faces. The design board includes all three type specimens.

The hero is an original procedural canvas sculpture with pause/play and reduced-motion support. It is not an AI-generated video. Generation-ready video concepts and delivery guidance are on the design directions page.

## Content boundaries

Planning targets remain labeled as proposals. No confirmed dates, prizes, partners, testimonials, customers, benchmark results, or production capabilities have been invented. The 25/75 stage split is preserved; phase-two details remain subject to pre-event calibration and freezing.

The participation page generates a text brief entirely within the browser. It does not register a team or submit personal information, and there is no backend. Official contact is linked to `oaic.ai` without inventing an email address.

## Hosting

`.openai/hosting.json` configures the private Sites deployment. Publish `dist/` as static assets. Each route has its own `index.html` shell; application content is rendered by `app.js`. Original source deck: `dist/assets/OAIC_Challenge_Pitch_Executive_V1.3.pptx`.

## Chinese title type and OAIC identity

Chinese headings default to a native wide face, Chill K Sans, with Michroma for Latin characters. Use `&cn=chill` (default) or `&cn=system` to compare against the previous system Chinese type. The body remains system Chinese type. A focused comparison is available at `/chinese-type.html`.

The Chinese webfont is a WOFF2 subset covering current site content, derived from [the author's source](https://github.com/Warren2060/ChillKSans). Its original SIL OFL 1.1 license is included at `dist/assets/fonts/chill-k-sans-LICENSE.txt`. Extend the subset or allow system fallback when adding new Chinese headings. The secondary author reference for broader width options is [Glow Sans](https://github.com/welai/glow-sans); it is not embedded in the current preview.

The provided original OAIC light/dark PNGs are used without recoloring for the initiative credit and footer. GAAC retains its separate event mark at `dist/assets/gaac-logo.png`; the older `oaic-logo.png` path remains a compatibility alias for GAAC.
