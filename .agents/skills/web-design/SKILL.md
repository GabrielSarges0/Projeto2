---
name: web-design
description: Design and front-end rules for building websites and web apps: concept, design tokens, typography, color, layout and grid, responsive and mobile-first, landing, pricing and CTA patterns, UI states, accessibility (WCAG 2.2 AA), motion, 3D/WebGL and premium Awwwards-style effects, Figma-to-code, and MCP servers for web work. Use it whenever you create, restyle, review or plan any site, page, landing page, component, design system or UI, including requests in Portuguese (site, página, layout, tipografia, cores, animação, design).
---

# Web design

Distilled from: Anthropic's frontend-aesthetics guidance, the Figma Design basics library (129 articles in 7 sections), Figma's design-system examples, the mcpservers.org catalog, and the user's creative-development directives. Load reference files only when the task needs them (index at the end).

## Scope decision (user, 2026-11-12): evolve, don't replace
Applies to ALL the user's sites, existing and new.
- **Improve each site's current design.** Keep its palette (color values), its fonts and its structure (sections, order, navigation, copy). Never introduce a new color, swap a typeface or reorder or remove sections unless the user asks.
- **What "improve" covers:** finish (weight, width, tracking and size within the current families), depth (layered surfaces, light and shadow using the existing colors), complete interaction states, motion, 3D and tech options (`references/creative-dev.md`), accessibility and performance.
- **Gate:** enhancements ship only when the user asks for them on that site. The site's `DESIGN.md` says what is authorized. Without an authorization line, requested UI work keeps the current look and applies only the Non-negotiables, even if the repo's rules tell agents to act without asking. Proposals (mock-ups on a canvas) are fine, outside the codebase.

## Precedence (higher wins)
1. The repo's own rules (CLAUDE.md, AGENTS.md, GEMINI.md, `.agents/rules`), its `DESIGN.md`, and its stack (framework, styling system, package manager).
2. Hard constraints: WCAG 2.2 AA in light and dark, Core Web Vitals, `prefers-reduced-motion`, security.
3. The scope decision above: current palette, fonts and structure stay.
4. The user's art direction (`references/creative-dev.md`) as enhancements on top of the current design.
5. Anti-generic guidance (`references/aesthetics.md`) and the design-basics references (`ui-ux.md`, `web.md`, `typography.md`, `color.md`, `process.md`, `brand.md`).
When two rules conflict, follow the higher one and say so in one line.

## Uniqueness (user decision, 2026-11-12): every site must look unique
- Each site already has its own palette, fonts and structure; keeping them keeps the sites distinct. `references/signatures.md` records each site's current look and its enhancements.
- **Distinct centerpieces:** no two sites use the same signature tech element (e.g. one site's 3D flask, another's particle field). Check `signatures.md` before choosing, and add the site's row after shipping.
- Pick enhancements from the site's own subject (a chemistry store gets glassware and molecules, a spa gets water and light) and never copy another site's effect.
- **Floor every site gets once authorized:** complete interaction states, one orchestrated entrance, depth with the existing colors, custom easing (no `linear` UI motion), reduced-motion fallbacks, the performance budgets.

## Workflow
1. **Explore.** Read the repo rules and `DESIGN.md`, package manager and scripts, styling system (Tailwind v3/v4, CSS modules, plain CSS), existing tokens and components. Given a Figma file, read its variables and map them to existing tokens.
2. **Brief (before code).** The page's one primary action, the current palette, fonts and section order (all kept), and the authorized enhancements from `DESIGN.md`.
3. **Tokens.** Name the existing colors as tokens (no new values) where the code uses raw hex; define light and dark values only from the existing palette.
4. **Build.** Every interactive element has default, hover, focus-visible, active, disabled and loading states (plus success/error/selected where relevant). Every data view has loading (sized skeleton), empty and error states.
5. **Motion and 3D last**, behind the guards in `creative-dev.md`.
6. **Verify.** Typecheck → lint → tests → build; 375px and 1280px; light and dark; keyboard only; contrast; reduced motion; Lighthouse/Core Web Vitals against the baseline. Report what you could not verify.

## Enhancing an existing site
1. **Baseline:** Lighthouse (mobile and desktop) and a keyboard pass. Record the numbers.
2. **Proposal:** a canvas mock-up of the current page with the enhancements, for the user to see before code.
3. **Authorization:** the user names the enhancements; write them in `DESIGN.md` under "Melhorias autorizadas".
4. **Implement** on a branch with a PR and preview; new dependencies only when an authorized enhancement needs them, loaded lazily.
5. **Re-measure:** no regression in Core Web Vitals or contrast; report the deltas.
6. **Record:** update the site's row in `references/signatures.md` in the kit and reinstall.

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
| Generic look | On new sites: no default Inter-on-white, purple gradient, or hero + 3 cards; no "all trends at once" (glass + bento + mesh + glow). |

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
| `references/signatures.md` | ALWAYS before adding an enhancement: each site's current look and its centerpiece |

Claims flagged ⚠ in the reference files conflict with WCAG or current practice. Follow the note, not the original claim. When a reference gives a different number than the Non-negotiables table (e.g. body line-height), the table wins. Fonts marked "GF?" in `typography.md`: confirm they are on Google Fonts before using `next/font/google`.
