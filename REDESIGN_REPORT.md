# Naranj demo redesign — implementation and QA report

## Product/source checklist

- [x] Inspected current repository, extracted archive, existing app, and documentation. The architecture Markdown is the working v2.1 authority; the similarly named DOCX has an internal v2.0 label.
- [x] Rechecked `DESIGN.md` v1.1, responsive/layout/color/font tokens, Abar Low fonts, supplied avatar art, skill workbook export, and question-type source.
- [x] Preserved the vanilla-JS app stack, role resolution after authentication, existing teacher assignment flow, practice rules already implemented, brand color tokens, and local font files.
- [x] Removed the login-only entry as the root experience and created a restrained public welcome/sign-in page without unsupported feature/benefit cards or marketing claims.
- [x] Added the requested student avatar picker using all ten supplied character assets; persist selection locally and provide profile-based change.
- [x] Added a Persian target-based Student Home tour with skip/finish, progress, previous/next, RTL arrow-key behavior, focus containment/restoration, responsive target placement, viewport/scroll remeasurement, reduced-motion support, and persistence/replay.
- [x] Generated three original Naranj-palette educational 3D illustrations, replaced their initial checkerboard backgrounds with solid ivory studio backgrounds, optimized them to WebP, and integrated them into actual student/teacher pages. The supplied mascot and student characters remain the Naranj assets.
- [x] Added lightweight route/page and component-state motion with a `prefers-reduced-motion` path; preserved task focus and immediate access to actions.
- [x] Added a GitHub Pages preview workflow and project-path static build, including direct-page documents for known routes and deep-link fallback handling for dynamic routes.
- [x] Added an explicit tablet composition rule and mobile-specific layouts for the new public hero and avatar/tour dialogs.
- [ ] Browser-level responsive verification, end-to-end flow testing, and formal accessibility audit remain outstanding because no browser executable or automation library is available here.

## Pages and flows

- **Public entry (`/`)** — branded welcome, one sign-in action, school-account guidance, and locally served mascot/3D notebook imagery. The architecture leaves public marketing copy open; no unapproved content section was added.
- **Login (`/login`)** — account-derived role routing remains; demo login continues to be local-only.
- **Student** — existing home, library, recommendation state, progress, achievements, profile, assignment practice, and safe exit/resume; persisted selected character appears in the shell and profile.
- **Avatar selection** — first student authentication without a saved avatar opens the required picker. One of ten original assets must be selected and explicitly confirmed. The first-run dialog cannot be dismissed before confirmation. A saved avatar bypasses it; Account allows changes.
- **Student tour** — automatically opens after first avatar confirmation/home entry, then is shown once. Skip and completion persist distinctly. It can be replayed from Account. Tour steps point only to home/library/progress/achievement elements that actually exist.
- **Teacher** — existing class, roster, skill-selection, assignment-builder, duplicate-warning, tracking, edit/cancel, and follow-up interactions remain available. No question authoring was introduced.

## Product decisions and missing content

1. **Explicit prompt vs. Architecture v2.1 conflict:** Architecture §12.3 says an avatar-selection gate is explicitly rejected and no tour is required. The current prompt explicitly requires both a first-run selection gate and an auto-start skippable tour. They were implemented as prompt-level overrides and are called out here rather than being described as v2.1-approved. Confirm product sign-off if the architecture remains immutable.
2. **Tour source attachment missing:** `Pasted text(4).txt` and the referenced screenshot were not found in the checkout/workspace. The actual React/TypeScript/Framer Motion component could not be reviewed, adapted line-by-line, or integrated verbatim. The app has no React runtime, so `src/tour.js` implements the described target-tour behavior in the existing vanilla-JS stack. A source-level review against the original component still requires the attachment.
3. **Question bank / teacher quiz workflow:** The source includes a question-types workbook and two demo examples only; it does not contain an approved skill-linked bank or generation/preview/regeneration rules. The existing examples are intentionally not linked to skills. No authentic quiz-generation UI was fabricated. Provide the approved question bank and behavior rules to complete this flow.
4. **Learning rewards and mastery:** The available source does not define SmartScore calculation, mastery transitions, hint/explanation content, coin earning, goal settings, or recommendations. The demo does not award ungrounded scores, coins, or mastery. Medal thresholds 80/90/100 are shown as source-defined thresholds but are not awarded by the sample questions.
5. **Curriculum gaps:** 156 skill-title rows are imported; IDs, prerequisites, successors, sequence, and question mappings remain absent rather than invented.
6. **Branch policy:** Work remains on the session's active branch `arena/dafb13f8-narenj`; no other branch was created or used.

## Asset record

- Optimized the ten supplied avatar PNGs to locally hosted WebP under `public/avatars/` (about 0.6 MB total).
- Optimized the supplied Naranj logo/mascot to `public/illustrations/naranj-brand.webp`.
- Added `public/illustrations/3d-notebook.webp` from `realvjy/3Dicons` at commit `8884d59e68a7bae0e0e2163af5b6c2ad992c01c8`; upstream license inspected as CC0 1.0. No external hotlinks.
- Added generated `learning-world.webp`, `math-exploration.webp`, and `achievement-medals.webp`; all three have intentionally opaque, warm-ivory studio backgrounds, not transparency. Details are in `public/illustrations/ATTRIBUTION.md`.
- Original documents and supplied assets remain preserved in the tracked `narenj.zip` source archive; extracted workspace copies were used for inspection.

## Validation results

- `npm run build` — **passed** in both default-root and `NARANJ_BASE_PATH=/narenj` modes.
- `node --check` over app, pages, server and build modules plus `git diff --check` — **passed**.
- Direct renderer smoke test exercised all implemented student, practice, and teacher page functions and verified all referenced new illustration files exist.
- Base-path preview HTTP checks returned **200** for landing, student and teacher static route entries, skill JSON, new WebPs and local Abar Low font. The output contains direct route documents for known pages and a 404-to-root fallback for dynamic deep links.
- No lint or TypeScript command is configured; project is plain JavaScript.
- No browser executable, Playwright, Puppeteer, or jsdom was available. Thus actual pointer/keyboard journeys, rendered RTL and viewport widths 320, 360, 375, 390, 430, 600, 768, 834, 1024, 1280 and 1440 have **not** been screenshot or end-to-end tested. No WCAG 2.2 AA conformance claim is made.
- Public Pages deployment has **not yet been verified**; the workflow and hosting setup are preparatory until deployment completion and external fetch checks succeed.
