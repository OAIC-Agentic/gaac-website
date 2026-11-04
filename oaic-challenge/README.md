# Grand Agentic AI Challenge · 智能体大奖赛

A bilingual event website with a static shell and a React-enhanced liquid glass participant guide. Current public copy is based on the event introduction supplied on 2 November 2026, retained at `dist/assets/GAAC_Event_Overview_2026-11-02.txt`. GAAC is the event; OAIC is the wider industry initiative.

## Preview and validation

Run `npm ci` on a fresh checkout, then `npm run dev` and open `http://localhost:4173`. The dev command builds and watches the React component while serving the static site; it prints the complete local URL. `npm run build` bundles the UI and copies the selected Lucide SVG icons and licenses into `dist/assets/`. `npm run check` checks site and tooling syntax. The static output in `dist/` is ready to publish.

## Content and navigation

- `/` — event identity, purpose, US$10,000 team grand prize, 168-hour format, three applications, participation paths.
- `/challenge/` — two stages, shared EdgePod platform, three required applications and deliverables, FAQ.
- `/resources/` — formal 100-point assessment, optional platform engineering bonus capped at 20 across the event, detailed framework, current source download.
- `/teams/` — captain-led applications, individual registration and teammate matching, teams of three or more, participant journey and prize conditions.
- `/partners/`, `/enterprise/`, `/research/` — resource sponsorship, enterprise scenarios and projects, research and education.
- `/ecosystem/` — continuing Testbed, Benchmark, white papers and standards, open-source solutions, training and enterprise projects; relative 90-day plan after all team windows.
- `/involve/` — participation guidance, official event channels and local brief composer.
- `/directions/` and `/chinese-type.html` — retained visual and typography comparison pages.

The homepage hero keeps the two-column layout with the event name, one short sentence, three task labels, key facts and two links. Participant requirements, platform context and scoring details are in the sections below. The intro copy and right-hand facts panel are separate elements, so a later video treatment can keep the event text and links. Below the hero, the six participant topics appear in a glass sidebar and a live preview pane. The first topic is visible immediately. Mouse hover previews another topic after a short delay; moving into the pane preserves the selection. Click, keyboard arrows/Home/End, and previous/next buttons also work. Phones show a compact icon grid with tap selection. Sponsorship stays outside the six participant topics. A small React island uses liquid-gooey for the spring-driven merged indicator, while text remains crisp. Reduced-motion users receive a static indicator and no CSS ambient or panel animations. Legacy section links select the corresponding preview. The homepage states the full Chinese and English event name prominently. Chinese is the default; `?lang=en` selects English. Navigation preserves language and visual choices.

## Rules and content boundaries

Each team has 168 hours. Phase one is 25 formal points; phase two comprises three required applications worth 25 each: editable PPT, financial analysis and visualization, and Deep Research. Per application, quality is 15 points, qualified efficiency 6, and reproduction/evidence 4. Optional reusable platform improvements earn up to 20 additional points overall, under separate acceptance and isolated offline work. The team grand prize is US$10,000 for one winner, subject to formal qualification, quality, safety and evidence requirements.

Teams can have three or more members. The first edition plans to select five teams for sequential platform windows. Dates, selection, platform calendar, detailed technical rules and appeals remain subject to organizing committee announcements at `https://gaac.gosim.org/`. No registration backend or unannounced dates are invented. The brief composer runs locally and does not submit a registration.

The original `OAIC_Challenge_Pitch_Executive_V1.3.pptx` is explicitly archived and does not define the current scoring or registration rules.

## Visual identity

Selected direction: Sky Editorial (`design=iris`) with sky blue #8AE6FF, deep ink #102C3A, porcelain #F6FAFA, pale ice #E4F5FA and marine #28667C. All palettes exclude orange. Review options `design=cobalt` and `design=acid` remain available. The design dock appears only on `/directions/` or with `review=1`.

English titles default to Michroma, with `type=unbounded` and `type=syncopate` alternatives. Chinese headings default to native wide Chill K Sans; `cn=system` selects system Chinese type. Body text remains readable system Chinese/DM Sans. Font licenses are included in `dist/assets/fonts/`.

Chill K Sans WOFF2 is subsetted to current site text from [the author's source](https://github.com/Warren2060/ChillKSans). Regenerate the subset for new Chinese headings. The original GAAC mark is retained. Supplied OAIC light/dark PNGs are unmodified; every OAIC logo links to `https://www.oaic.ai/?lang=zh` or `?lang=en`, matching the current language. The GAAC logo returns to the event homepage.

The homepage uses a compact event facts panel instead of the earlier abstract canvas sculpture. The sculpture source is retained for optional future use. Video concepts on the design page are generation briefs, not generated videos.

## Hosting

`.openai/hosting.json` retains the existing Sites project identity and publishes `dist/` as static assets. Preserve its existing access audience. `app.js` handles navigation and UI; `event-pages.js` contains the current bilingual public event content. Each route has an HTML shell with event-specific title and description.

## Liquid glass UI and icons

`src/liquid-guide.jsx` supplies the hover preview and real `Liquid` / `Liquid.Item` animation. `dist/glass.css` supplies translucent surfaces, backdrop blur, highlights and restrained motion in the existing sky palette. `scripts/build-ui.mjs` bundles this island with esbuild; the rest of the site remains static JavaScript. The six full content bodies are retained in the initial markup, with a readable expanded fallback if the island cannot load.

Icons use `lucide-static` and are served as selected SVG masks. Lucide ISC/MIT and liquid-gooey/React notices are retained in `dist/assets/`; no visible footer icon credit is needed. Registration and team formation are marked as coming soon. The previous/next controls remain above the animated content, independent of panel height.
