# GAAC Hero world

`index.js` owns the renderer, pause clock, gesture handling, projected HTML labels and teardown. `geometry.js` builds the blue glass campus: three application pavilions, a shared EdgePod server centre and connecting bridges, using cached procedural geometries and instanced details. `lighting.js` shares the camera and daylight setup with the static cover generator. Scene content contains no text textures: labels and task navigation are HTML in `dist/event-pages.js`.

`motion.js` animates all three applications concurrently. PPT arrangement, financial charts and research filing have smooth independent rhythms of roughly 7.2, 6.4 and 8.4 seconds. No application waits for another to finish. `timeline.js` supplies continuous wave and phase helpers; bridge signals, server lights, page turns and ambient motion run on the same pause-aware clock. Signals and the chart tracer fade at path boundaries, while completed content remains visible.

Desktop rotation follows mouse hover position, without pressing or dragging; leaving the scene eases back to its resting angle. Touch keeps horizontal exploration and native vertical scrolling. Clicking geometry or a keyboard-accessible HTML label centres and frames that destination for a substantial close-up. The four labels dock into a stable switcher, and the overview control restores the campus. `focus.js` fades surrounding geometry and preserves animated material opacity; business animation continues during exploration. Detail framing recalculates on resize. Reduced-motion preference disables hover response and uses immediate, explicit focus changes.

Focus fading uses alpha-hashed coverage for solid surfaces, so their color and depth disappear together while they stay ahead of transmissive glass. Shadow casters have matching depth materials whose opacity follows the animated surface; transparent glass never writes depth. These settings remain fixed throughout a transition, avoiding shader recompilation and full-strength shadows from nearly invisible islands. All hidden workspaces continue to use the same animation clock. The research sheet turns upward across the spine and reverses its curl on the left, keeping the paper and print above the open spread.

Run from the project root:

```sh
npm run dev
npm --prefix oaic-challenge run build
npm run check
```

The preview is http://localhost:4173/. esbuild watches both the existing guide and the new Hero module. Reload the browser after edits. No remote models or textures are fetched.

The mobile quality tier is selected on mount: no shadow map, no transmission pass, fewer bridge signals, simpler geometry and a 1.5 pixel-ratio cap. Desktop is capped at 1.8. Rendering is capped at 30 fps on mobile and 60 fps on desktop. Intersection and document visibility stop requestAnimationFrame entirely. Reduced motion starts with a completed still scene; the visitor can explicitly play it. A transparent WebP cover remains visible until the first successful frame and on WebGL failure/context loss.

`mountHero()` returns the cleanup function. The app calls it before replacing HTML on a language change and rejects late imports using its existing render version. Cleanup aborts listeners, disconnects observers, cancels frames, disposes unique geometries/materials/textures and releases the WebGL context.

## Browser QA and cover generation

Development-only entrypoints live in `scripts/hero-browser-checks.mjs` and `scripts/hero-cover.mjs`. To run either, bundle it to a temporary asset and serve a temporary HTML page containing the module script. Run from `oaic-challenge`:

```sh
npx esbuild scripts/hero-browser-checks.mjs --bundle --format=esm --outfile=dist/assets/hero-checks-tmp.js
npx esbuild scripts/hero-cover.mjs --bundle --format=esm --outfile=dist/assets/hero-cover-tmp.js
```

The checks entry expects a `<pre>` element and emits its report there; `document.body.dataset.result` becomes `passed` on completion. It exercises real WebGL rendering, lifecycle, resource disposal, synthetic touch direction, reduced motion, unavailable/lost contexts and existing page routes. The cover entry emits a transparent WebP data URL in `#cover-output`, rendered from the same geometry and lighting. Save its decoded bytes as `dist/assets/hero-islands.webp`. Remove temporary pages and bundles afterward.

Current campus screenshots and check results are in `qa/hero-campus/`; `qa/hero/` contains the earlier design. The browser checks also sample all three application animations across 42 seconds to verify concurrent changes. Actual phone hardware was not available; responsive layout and scrolling are checked in the browser, with touch direction checked using synthetic pointer events.

Hover and close-up interaction screenshots and the 46-check regression report are in `qa/hero-hover-detail/`. The checks observe the rendered camera to verify rotation without a mouse press, return on pointer leave, substantial zoom for all four destinations, direct geometry picking, continued animation and reduced-motion behavior.

`scripts/hero-transition-checks.mjs` measures actual rendered frames and shader compilation during entry/exit. Its temporary page needs a Hero host, `<pre>` and `#frames`. Optional `?capture=1` saves a visual frame sequence; capture timings include image readback/encoding and must not be used as performance measurements. Transition regression evidence is in `qa/hero-transitions/`.

`scripts/hero-page-shadow-checks.mjs` needs only `<pre>` and `#frames`. It checks the sheet's clearance across a full turn and compares real WebGL pixels immediately before and after hiding outgoing objects. Evidence in `qa/hero-page-shadow/` includes an isolated comparison using the previous focus code with the same corrected geometry, lighting, camera and animation time, plus current interaction and transition checks.
