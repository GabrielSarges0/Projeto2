# Aesthetics: escaping the generic "AI look"

Source: Anthropic, "Improving frontend design through Skills" (2025-11-12). Conflict resolutions are ours.

## Why
Models converge on the statistical centre of web design: Inter/Roboto, purple gradient on white, flat backgrounds, no motion, predictable layouts. That look reads as AI-made and disposable. Every visual choice must be deliberate and specific to the context.

## Rules
### Typography
- Never default to Inter, Roboto, Open Sans, Lato, Arial or system fonts on greenfield work.
- Pick ONE distinctive family and use it decisively; pair by contrast: display + mono, serif + geometric sans, one variable font across extreme weights.
- Use extremes: 200 vs 800/900 weight, not 400 vs 600. Size jumps of 3x+ between display and body, not 1.5x.
- Starting points (rotate, never repeat by habit): code look — JetBrains Mono, Fira Code; editorial — Playfair Display, Crimson Pro, Newsreader; technical — IBM Plex family, Source Sans 3; distinctive — Bricolage Grotesque. Space Grotesk is itself an over-used fallback: avoid converging on it.

### Color & theme
- Commit to one cohesive aesthetic, expressed as CSS custom properties / tokens.
- One dominant color with sharp accents beats a timid, evenly distributed palette.
- Draw from IDE themes, cultural aesthetics and named themes (editorial, terminal, brutalist, RPG, Swiss, risograph…).
- Vary across projects: different fonts, palettes, light-first vs dark-first.

### Motion
- One orchestrated page-load with staggered reveals (`animation-delay`) beats scattered micro-interactions.
- CSS-only for plain HTML; Motion library for React only if the project already has it.

### Backgrounds
- Build atmosphere and depth: layered gradients, geometric patterns, noise/grain, contextual effects. Avoid flat defaults.

### Avoid
Over-used families, purple-on-white gradients, cookie-cutter hero → 3 cards → CTA layouts, and any choice that would fit every brand equally.

## Conflict resolutions (these win over the rules above)
| Tension | Resolution |
|---|---|
| Distinctive font vs an existing design system | The repo's system and tokens win. Boldness applies to greenfield, artifacts and unbranded surfaces. |
| Staged motion vs motion budget | Each element 150–250 ms, animate only `transform`/`opacity`, stagger via `animation-delay`; `prefers-reduced-motion: reduce` shows content instantly. |
| Gradient/pattern backgrounds vs WCAG | Measure text contrast (4.5:1, large 3:1) against the worst point of the background, in both themes. |
| "Vary light/dark" vs shipping both themes | Vary which theme leads the aesthetic; always ship and test both. |
| Weights 100/200 | Display sizes only (≥ ~24px); never for body or small UI text. |
| Loading fonts | Next.js: `next/font` (self-hosted, no CLS). Plain HTML/artifacts: Google Fonts `<link>` with `display=swap`. |
| Heavier stacks (React + Tailwind + shadcn) for richer UIs | In existing repos this is a new dependency: ask first; never add Tailwind to a project that doesn't use it. |

## Reference prompt (Anthropic, ~400 tokens)
```text
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.

Focus on:
- Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
```
