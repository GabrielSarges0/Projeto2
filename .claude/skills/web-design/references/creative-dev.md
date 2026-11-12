# Creative development: 3D, motion, premium aesthetics

Source: the user's "Creative Developer / Awwwards" directives (2026-11-12), with engineering guardrails. Every rule here sits under the hard constraints in SKILL.md: WCAG 2.2 AA in both themes, Core Web Vitals, reduced motion, and the repo's own stack.

## Stack
| Need | Default for new projects | In an existing repo |
|---|---|---|
| Structure and styles | Next.js (App Router) + React + Tailwind CSS v4 tokens | Follow the repo. Never add Tailwind where it isn't used. |
| UI motion | Motion (`motion` package, `import { motion } from "motion/react"`; formerly Framer Motion) | Keep whatever is installed. Propose additions with size and justification. |
| Timelines and scroll | GSAP + ScrollTrigger (`@gsap/react` `useGSAP` for cleanup) | Same |
| 3D / WebGL | React Three Fiber + drei; Spline (`<spline-viewer>` or `@splinetool/react-spline`) for designer-authored scenes | Same: each library is a new dependency, so ask first |
| Smooth scroll | Lenis | Only if the concept needs it (see Accessibility) |

## Art direction
- No template look: no Bootstrap layouts, no hero → three flat cards → CTA, no purple/blue cliché gradients, no depthless cards.
- Technique menu: dark-first palette, subtle mesh gradients, noise/grain texture, glassmorphism (`backdrop-blur` over a tinted surface), inner luminous borders (`border-white/10` on dark), bento grids, pointer-reactive glow.
- Use the menu, not a recipe. Pick 1–2 techniques per project from the concept, under the uniqueness rules in SKILL.md (no technique is the primary signature of more than 2 projects; check `signatures.md`). Combining all of them is now itself the generic AI look (see `aesthetics.md`).
- Dark mode is a lead-theme option, not the default for every site: choose dark-first or light-first per project. Both themes always ship.
- The menu is a starting point, not a limit. Other directions are equally valid when the brand calls for them: Swiss/International grid, editorial print, brutalist, risograph/duotone, organic/botanical, retro-futurist, industrial catalogue, kinetic typography.
- Typography: big display headings with negative tracking (`tracking-tighter`) and strong hierarchy contrast. Approved: Syne, Plus Jakarta Sans and the families in `aesthetics.md`. Inter only for UI body text in dense products. Avoid Space Grotesk (convergence trap). Never reuse a display family across projects (check `signatures.md`).
- Lighting and depth: one key light direction per page; shadows, glows and gradients must agree with it.

## Motion physics
- Never use `linear` for UI motion. Use custom curves, e.g. `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for entrances and `cubic-bezier(0.7, 0, 0.84, 0)` for exits, or springs (Motion `type: "spring"`, tuned stiffness and damping; avoid bouncy defaults on UI chrome).
- Exception: use linear when motion maps 1:1 to progress (ScrollTrigger `scrub` with `ease: "none"`, progress bars, spinners, marquees).
- UI transitions run 150–250 ms. Hero and section reveals may run longer but stagger children by 40–80 ms. Animate only `transform` and `opacity` (filters and blur only on small elements).
- Make every animation interruptible; never block input while it plays.

## Micro-interactions
- Magnetic buttons, custom cursor and pointer-follow glow only under `@media (hover: hover) and (pointer: fine)`. Touch gets plain press feedback (scale ~0.97).
- Keep the native cursor available, or render the custom cursor as a decoration that follows it. Never hide the focus ring: keep `:focus-visible` styling in full.
- Every pointer effect needs keyboard parity: what hover reveals, focus reveals too.
- Update pointer-reactive effects through CSS custom properties (`--x`, `--y`) in a rAF-throttled handler, never per-event React state.

## 3D / WebGL performance
- Load 3D lazily: `next/dynamic(() => import(...), { ssr: false })`, mounted when the scene nears the viewport (IntersectionObserver). A static poster image is the LCP element and the fallback.
- Cap pixel ratio (`<Canvas dpr={[1, 2]}>`). Use `frameloop="demand"` for static scenes, and pause the render loop when off-screen or when the tab is hidden.
- Budget by device: cut particles/polygons by ~50–75% on mobile or low `navigator.hardwareConcurrency`, use drei `<AdaptiveDpr>`/`<PerformanceMonitor>`, compress assets (Draco/Meshopt geometry, KTX2 textures), instance repeated meshes.
- Spline: its runtime is heavy. Use it only above the fold when the poster-image strategy is in place; otherwise prefer R3F.
- Target 60 fps on a mid-range phone; verify with the Performance panel and a throttled CPU, not on a desktop GPU.
- Provide a no-WebGL fallback, and honour `prefers-reduced-motion` (static frame, no auto-rotation).

## Smooth scroll (Lenis) and accessibility
- Disable Lenis entirely under `prefers-reduced-motion: reduce`.
- Keep native scrolling semantics: the scrollbar, keyboard scrolling (Space/PageDown/arrows), anchor links with focus moved to the target, find-in-page, and `position: sticky`.
- Integrate with ScrollTrigger by driving `ScrollTrigger.update` from Lenis's scroll event, using one shared rAF.
- Never scroll-jack (snapping that fights user input) on content pages.

## Contrast with glass and gradients
- Measure text contrast against the worst point behind the glass or gradient, in both themes: 4.5:1 for text, 3:1 for large text and UI.
- Add `@supports not (backdrop-filter: blur(1px))` with an opaque fallback surface.
- Limit stacked `backdrop-filter` layers (≤ 2 visible at once); they are expensive on mobile GPUs.

## Using references the user sends
- Component libraries (aceternity.com, magicui.design, hover.dev, threejs.org/examples, codrops, Spline community): read the docs and source, extract the technique (animation architecture, shader/3D math, timing), then re-implement it with the project's tokens and stack. Check licences: some kits have paid Pro tiers; MIT code still needs its notice if copied verbatim.
- Inspiration sites and screenshots (godly.website, awwwards.com, land-book.com, lapa.ninja): analyse composition, grid, palette, type scale, lighting, spacing and depth, and write those findings down as tokens before coding. Reproduce the atmosphere, never the brand, copy, logos or assets.
- Network: in sandboxed sessions each new domain may need to be allowed first. Ask for it rather than working around blocks.
