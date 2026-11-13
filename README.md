# Naranj interactive demo

Persian-first, RTL educational-platform prototype using browser-native JavaScript and CSS. It preserves the project's vanilla-JS stack and uses no runtime or build dependencies. Authentication, practice, onboarding persistence, and teacher changes are local demo simulations, not production services.

## Run locally

Requirements: Node.js 18 or newer.

```sh
npm run dev
```

Open <http://localhost:4173>. The login form accepts:

| Role resolved after sign-in | Username | Password |
|---|---|---|
| Student | `student.demo` | `naranj-demo` |
| Teacher | `teacher.demo` | `naranj-demo` |

There is no pre-authentication role selector. The student profile, avatar, tour state, class/assignment changes, and practice state are saved in this browser's local storage. Reset via **Account and sign out → Start demo again**.

To build and serve the static copy:

```sh
npm run build
npm run preview
```

The static output is placed in ignored `build/`. `PORT` can override the default, e.g. `PORT=4174 npm run dev`.

## Demo surfaces and flows

- Public entry at `/`: one entry action, a welcome message, and school-account sign-in guidance. No marketing claims, feature-card section, testimonial, pricing, or unverified statistics were added.
- Student: home and assignment practice, skill library, recommendations state, progress, achievements, profile/avatar change, focused practice, and safe exit/resume.
- Teacher: active class context and switching, roster, skill library/selection, multi-step assignment creation/review/publication, tracking, due-date edit, cancellation, and follow-up assignment.
- First-time student sign-in opens a non-dismissible-until-confirmed picker using the ten supplied student avatars. It saves the cosmetic selection locally; the student can change it later from Account.
- After initial avatar confirmation, a short Persian target-based tour starts on Student Home. It has responsive placement, progress, previous/next, skip/finish, Escape and RTL arrow-key support, scroll/resize remeasurement, reduced-motion behavior, and persisted completion/skip state. Account provides a replay action.

## Sources, constraints, and unresolved content

- Product behavior and design authority were reviewed from the supplied `narenj.zip` source archive (including its extracted workspace copy). **Version discrepancy:** the requested design-spec v2.0 is not present; the file in the archive is titled v1.1. Its implementation rules and referenced layout, component, color, and typography specifications were reviewed and applied without changing supplied identity tokens. The architecture Markdown identifies itself as v2.1 while its older embedded control table says v2.0. These source labels have not been silently altered.
- The prompt specifically requires a first-run avatar gate and auto-start skippable tour. This conflicts with Product UX Architecture v2.1 §12.3, which explicitly rejects an avatar-selection gate and says no tour is required. They were implemented as prompt-level overrides, not represented as v2.1-approved flows. Product sign-off on this scope conflict remains advisable.
- No screenshot or `Pasted text(4).txt` attachment was present in the checkout or workspace during implementation. Accordingly, the supplied React/TypeScript component could not be inspected or integrated verbatim. `src/tour.js` is a dependency-free vanilla-JS adaptation of the behavior described in the prompt (native dialog/portal-equivalent top layer, callbacks, focus containment, target measurement, responsive placement, keyboard and reduced-motion behavior). It is not a claim that the missing component's source was audited. Attach the file for a source-level comparison.
- The public landing's approved content is unresolved in the architecture. The implemented copy is limited to the Naranj name/welcome, one sign-in entry, local-demo context, and school-account sign-in instruction; no unsupported product claims or extra landing sections were added.
- `src/data/skills.json` contains 156 skill-title rows; the source lacks skill codes, prerequisite/successor relations, sequence, and skill-question mappings. These gaps remain blank. `src/data/questions.js` has only two explicitly demo-only examples, not a live/authoritative question bank. Therefore an authentic teacher quiz generator/preview/regenerate flow cannot be built without inventing question content or mappings; it remains unimplemented pending the approved question bank and rules. Teacher question authoring/editing is not present.
- SmartScore formula, mastery transitions, hint/explanation content, coin-earning rules, goals, and recommendation ordering are not supplied. Practice stays labeled as local sample interaction and does not award scores, coins, or mastery. Medal threshold labels 80/90/100 are source-defined, but no medal is awarded from the demo examples.
- The notebook from `realvjy/3Dicons` remains a locally served, optimized CC0 1.0 asset (no production hotlink). Three original AI-generated 3D educational still-life illustrations are optimized as local WebP and integrated into student Home, Library, Progress, Achievements, and teacher Library. Their initial fake checkerboard backgrounds were replaced by a seamless ivory studio background; the current files are intentionally opaque, not described as transparent. See `public/illustrations/ATTRIBUTION.md`. The supplied Naranj mascot/logo and avatars remain the character identity.

## Build, deployment, and validation

- `npm run build` validates required source/assets, JavaScript syntax, and curriculum JSON, then copies the static app. For GitHub Pages, `NARANJ_BASE_PATH=/narenj npm run build` emits project-path asset URLs, direct route entry documents for known routes, and a deep-link fallback for dynamic paths.
- `.github/workflows/pages.yml` is configured to deploy a **preview** from this session branch through GitHub Actions. This is a local-storage-only demo, not production authentication or a live backend.
- Build and `node --check` commands pass for app/page/server/build scripts. A direct page-render smoke test covered all implemented student, practice, and teacher page renderers and local illustration references.
- The base-path build was served locally; HTTP smoke checks returned 200 for landing, student/teacher route documents, the full skill JSON, all three new illustrations, and a local WOFF2 font.
- The responsive design uses the supplied breakpoints/tokens and page/component-specific motion. `prefers-reduced-motion` disables nonessential transitions and route entrance effects.
- No browser executable or automation runtime is available here. Therefore no visual viewport test at 320, 360, 375, 390, 430, 600, 768, 834, 1024, 1280, or 1440px, browser journey, screen-reader run, or formal WCAG audit is claimed. These require manual/browser-based QA.
- There is no configured lint or TypeScript check; the app is plain JavaScript. Passing build/smoke checks is not a substitute for browser QA.
