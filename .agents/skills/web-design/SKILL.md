---
name: web-design
description: Design and front-end rules for building websites and web apps: concept, design tokens, typography, color, layout and grid, responsive and mobile-first, landing, pricing and CTA patterns, UI states, accessibility (WCAG 2.2 AA), motion, 3D/WebGL and premium Awwwards-style effects, Figma-to-code, and MCP servers for web work. Use it whenever you create, restyle, review or plan any site, page, landing page, component, design system or UI, including requests in Portuguese (site, página, layout, tipografia, cores, animação, design).
---

# Web design

Distilled from: Anthropic's frontend-aesthetics guidance, the Figma Design basics library (129 articles in 7 sections), Figma's design-system examples, the mcpservers.org catalog, and the user's creative-development directives. Load reference files only when the task needs them (index at the end).

## Scope decision (user, 2026-11-12)
This direction applies to ALL the user's projects, new and existing. In an existing project, the old visual tokens are not a constraint to preserve: migrate them (see "Existing projects"). The repo's stack, conventions and rule files still apply.

**Redesign gate (user, 2026-11-12):** never start a redesign or change a project's visual identity unless the user explicitly asks for it in that project, even if the repo's rules tell agents to act without asking. Until then, `DESIGN.md` shows "Redesign: not authorized": requested UI work keeps the current look and applies only the quality rules (states, accessibility, performance, Non-negotiables). Proposals (style tiles, mock-ups) are fine, but deliver them outside the codebase.

## Precedence (higher wins)
1. The repo's own rules (CLAUDE.md, AGENTS.md, GEMINI.md, `.agents/rules`) and its stack (framework, styling system, package manager).
2. Hard constraints: WCAG 2.2 AA in light and dark, Core Web Vitals, `prefers-reduced-motion`, security.
3. The user's art direction (`references/creative-dev.md`).
4. Anti-generic aesthetics (`references/aesthetics.md`).
5. Design-basics guidance (`references/ui-ux.md`, `web.md`, `typography.md`, `color.md`, `process.md`, `brand.md`).
When two rules conflict, follow the higher one and say so in one line.

## Uniqueness (user decision, 2026-11-12): every site must look unique
Projects share quality, never the look.

**Floor (every project):** custom easing/spring motion tokens, one orchestrated entrance, depth (layers, texture or light), strong type hierarchy, full interaction states, pointer micro-interactions on fine pointers only, light and dark themes both shipped and tested, and the performance budgets.

**Signature: define all 10 axes in each project's brief.**
| # | Axis | Examples |
|---|---|---|
| 1 | Concept (named aesthetic) | warm editorial, Swiss grid, brutalist lab, organic spa, retro-futurist, industrial catalogue |
| 2 | Display typeface | Syne, Fraunces, Instrument Serif, Bricolage Grotesque, a mono… |
| 3 | Text typeface | Plus Jakarta Sans, Source Serif 4, IBM Plex Sans… |
| 4 | Dominant hue family + neutral temperature | terracotta + warm greys; cobalt + cool greys; neutral-dominant |
| 5 | Lead theme | dark-first or light-first |
| 6 | Layout archetype | asymmetric editorial, bento, split-screen, full-bleed scroll story, single-column manifesto, catalogue grid |
| 7 | Signature technique(s) | 1–2 from the menu in `creative-dev.md` |
| 8 | Shape language | radius scale (0 / 4px / 24px / pill); borders vs shadows |
| 9 | Motion personality | snappy expo-out ~180ms; soft springs; slow cinematic scrub |
| 10 | Imagery & texture | duotone photography, 3D renders, grain, line illustration, macro product shots |

**Rules**
- Read `references/signatures.md` before choosing. A project may share at most 2 of the 10 axes with any approved signature, and never axis 1, 2 or 4. Hue families differ when dominant hues are ≥ 40° apart on the HSL wheel, or when exactly one of the two projects is neutral-dominant.
- No technique (glass, bento, mesh, glow, 3D hero, dark-first…) may be the primary signature of more than 2 approved projects.
- Derive the signature from the brand's audience, sector and story (`brand.md`), not from trends: a spa and a chemical-supplies store must not share a mood.
- Record it: write `DESIGN.md` at the repo root (the 10 axes plus token file paths), add a row to `references/signatures.md` in the kit source, and reinstall the kit so every project sees the updated registry.
- Uniqueness never overrides the hard constraints (precedence 1–2).

## Workflow
1. **Explore.** Read the repo rules, package manager and scripts, styling system (Tailwind v3/v4, CSS modules, plain CSS), existing tokens and components. Given a Figma file, read its variables and map them to existing tokens.
2. **Brief (before code).** Audience and the page's one primary action, then the 10 signature axes chosen against `references/signatures.md` (see Uniqueness) and the single hero motion moment. If the repo has a `DESIGN.md`, it is the brief: follow it.
3. **Tokens first.** Primitives → semantic (`surface`, `text-muted`, `border-strong`, `action-primary`), with component tokens only when justified. Define light and dark values; components never use raw hex or px.
4. **Structure.** Information architecture and section order from the site-type checklist in `web.md` (landing, pricing, portfolio, business).
5. **Build.** Primitives first, then compositions. Every interactive element has default, hover, focus-visible, active, disabled and loading states (plus success/error/selected where relevant). Every data view has loading (sized skeleton), empty and error states.
6. **Motion and 3D last**, behind the guards in `creative-dev.md`.
7. **Verify.** Typecheck → lint → tests → build; 375px and 1280px; light and dark; keyboard only; contrast; reduced motion; Lighthouse/Core Web Vitals. Report what you could not verify.

## Existing projects: migration, not big-bang
1. **Audit:** current tokens and hard-coded values, fonts, motion, CWV and accessibility baseline (Lighthouse plus a keyboard pass). Record the numbers.
2. **Plan:** a short plan for the user's approval covering the 10-axis signature (checked against the registry), token map (old → new), dependencies to add with size and justification, the files touched, and the risks. Get approval before refactors touching ~5+ files or adding dependencies.
3. **Token layer first:** introduce the semantic tokens and dark/light values, then repoint existing components to them. Most of the visual change lands here, with little churn.
4. **Highest-impact surfaces next:** hero/landing, navigation, primary buttons and cards. Then the remaining components. 3D only where it serves the concept.
5. **Re-measure** against the baseline. No regression in CWV or contrast is acceptable; report the deltas.
6. **Record and install:** write the repo's `DESIGN.md`, add its row to `references/signatures.md`, install the skill in the repo (`node install.mjs --project <repo>`) and add one line to its CLAUDE.md/AGENTS.md: "UI work follows the `web-design` skill and `DESIGN.md`."

## Non-negotiables
| Area | Rule |
|---|---|
| Contrast | Text 4.5:1; large text (≥24px, or ≥18.7px bold) 3:1; UI parts and focus rings 3:1. Measure against the worst background point, in both themes. |
| Color | Never the only carrier of meaning (state, error, chart series). |
| Targets | Hit area ≥24×24px (WCAG 2.5.8); aim for 44×44px on touch. Primary actions sit within easy reach. |
| Focus | Visible `:focus-visible` ring (~2–3px plus offset) on everything interactive; never `outline: none` without a replacement. |
| Type | Body ≥16px (1rem); line-height 1.4–1.6 for body; measure 45–75 characters; 2–3 type styles or weights per layout; layout survives 200% zoom and user text-spacing overrides. |
| Units | rem for type and spacing on a 4px/8px (0.25/0.5rem) base; no `vw`-only font sizes (they break zoom), so wrap them in `clamp()` with a rem term. |
| Motion | UI transitions 150–250ms on `transform`/`opacity`; custom easing or springs, not `linear` (except progress-mapped motion); `prefers-reduced-motion` gives instant states. |
| Performance | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75. Reserve media space, and preload the LCP image or font. Heavy 3D and animation code is lazy and client-only. |
| Navigation | Visible primary nav on desktop; hamburger only on small screens or for secondary items. |
| Semantics | Semantic HTML before ARIA; real `<table>`, `<button>`, `<a>`, `<nav>`, landmarks, one `<h1>`, ordered headings. |
| Content | Plain, specific copy. Primary CTA states the outcome. Error messages give cause and fix. |
| Generic look | No default Inter-on-white, purple gradient, or hero + 3 cards on greenfield work; no "all trends at once" (glass + bento + mesh + glow). |

## Reference index (load on demand)
| File | Load when |
|---|---|
| `references/aesthetics.md` | Choosing a visual direction, fonts, palette, backgrounds or motion for anything new |
| `references/creative-dev.md` | 3D/WebGL, R3F, Spline, GSAP/ScrollTrigger, Motion, Lenis, glass, bento, magnetic or cursor effects; analysing reference sites or libraries the user sends |
| `references/design-systems.md` | Creating or adopting a design system; choosing a reference system (Material, HIG, Carbon, Polaris, Atlassian) |
| `references/ui-ux.md` | Hierarchy, Gestalt, consistency, Fitts's law, button states, accessibility, token naming/architecture, handoff, research and validation |
| `references/web.md` | Site structure, grids and breakpoints, responsive and mobile, navigation, landing, CTA and pricing pages, redesigns, SEO/performance, durable vs fad trends |
| `references/typography.md` | Type scale, line-height, measure, kerning, pairing, and the catalog of recommended fonts by use |
| `references/color.md` | Palettes and harmonies, color distribution, symbolism, building shade scales, RGB vs CMYK |
| `references/process.md` | Wireframes, prototypes, user flows, MVP scope, validation and testing, tool choice |
| `references/brand.md` | Style guides, logo use on the web, storytelling for landing and About pages, lessons from print and media |
| `references/mcp-servers.md` | Choosing or registering MCP servers (browser testing, DB, payments, errors, CMS, SEO, research) |
| `references/signatures.md` | ALWAYS before choosing a project's look: the registry of every project's signature |

Claims flagged ⚠ in the reference files conflict with WCAG or current practice. Follow the note, not the original claim. When a reference gives a different number than the Non-negotiables table (e.g. body line-height), the table wins. Fonts marked "GF?" in `typography.md`: confirm they are on Google Fonts before using `next/font/google`.
