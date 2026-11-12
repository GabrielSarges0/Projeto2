# UI/UX design principles: agent rules (distilled from 40 Figma "Design basics" articles)

`[slug]` = source article. `⚠` = conflicts with WCAG 2.2 AA or current web practice; the note says what to do instead.

## 1. Visual hierarchy and emphasis
- Order content by what users care about most. Decide what shows first and what needs a scroll. Use size and weight, contrast, spacing, color and alignment. Put the most important information at the top. [ui-design-principles] [graphic-design-principles]
- Give each view one focal point, usually the key CTA. [gestalt-principles]
- Use one emphasis technique per element, not bold + red + italic + larger + indent. "If everything is bold, nothing is bold." [consistency-in-design]
- Give the primary action a clear visual advantage. Look-alike primary and secondary buttons make users hesitate. [button-states]
- Reserve high contrast for critical information or destructive actions (a red "Delete account"). Make the safe option quieter. [ui-design-principles] ⚠ A quieter gray option still needs 4.5:1 text contrast and a 3:1 boundary (WCAG 1.4.3, 1.4.11).
- Place key content on Z-, F- or layer-cake scan paths. Don't overuse contrast. [graphic-design-principles]
- Make highlights with texture or shape, not color alone. [what-is-visual-hierarchy]
- Be generous with white space; space around a button makes it easier to find and tap. Match the amount to density, with uniform padding. [simplicity-design-principles] [graphic-design-principles]
- Design for the user's real context: rushed, one-handed, at varying distances. [what-is-visual-hierarchy]

## 2. Grouping and layout (Gestalt)
- **Proximity:** keep related controls together and separate groups with white space. Keep destructive or exit controls away from frequent ones (Quit is not placed next to Play). [ui-design-principles] [graphic-design-principles]
- **Similarity:** the same look means the same function. **Common region:** group with cards, sidebars, tabs and accordions. **Connectedness:** link items with bullets and lines. **Continuity:** align items on a line to lead to the key action. **Common fate:** animate related items in the same direction. **Symmetry/prägnanz:** prefer simple, balanced shapes. [gestalt-principles]
- Snap to a layout grid on a shared edge, center or baseline, with a consistent left margin. [graphic-design-principles] [consistency-in-design]
- Keep recurring elements in the same place on every screen (if a title sits 100px from the top, it sits there everywhere). [consistency-in-design]
- Left-align text in left-to-right languages. [graphic-design-principles] ⚠ Use `dir` and CSS logical properties so RTL works. [constraints-in-design]
- Cap content width with containers that adapt to the screen. Balance heavy elements against light ones. [what-is-ui-design] [graphic-design-principles]
- Golden ratio 1:1.618 for column splits (1000 → 618/382 → 236). Place focal points where golden lines cross rule-of-thirds lines. Keep the main layout symmetric and use the ratio for details. Drop it when it hurts usability. [golden-ratio] ⚠ A ×1.618 type or spacing scale is too steep for UI text; use a gentler modular scale.

## 3. Consistency and coherence
- A component looks and behaves the same everywhere. Every button of one type shares its states. [ui-design-principles] [button-states]
- Follow conventions: navigation at the top, the menu in a top corner, Material/HIG patterns. Users shouldn't have to relearn. [consistency-in-design] [interaction-design] [simplicity-design-principles]
- Keep density and voice consistent across pages. An airy home page needs an airy product page; a formal tone stays formal. [consistency-in-design]
- Use 2–3 type styles. For color, use one primary and one secondary, a few tones of each, plus black and white. [consistency-in-design]
- Break a pattern only on purpose and with a reason. An unexplained bigger button adds cognitive load. User needs win over rigid consistency. [ui-design-principles] [consistency-in-design]
- Aim for coherence: features should feel built by one team with one set of values. [what-is-product-design]

## 4. Simplicity
- Surface the 1–2 core tasks (Google Photos shows photos and search). Put secondary features in menus or contextual UI. [simplicity-design-principles]
- Use progressive disclosure: split long forms and onboarding into steps, and always show "step X of N". [ui-design-principles] [what-is-visual-hierarchy]
- To simplify, remove elements, shorten text, split into steps and use plain language. [reducing-design-complexity]
- A standard action should take 3–5 taps at most. Take extra care in health, money and long-term decisions to reduce fear, uncertainty and doubt. Don't oversimplify. [simplicity-design-principles]
- Hick's law: more and more complex choices mean slower decisions, so trim options. Reduce memory load (filters, for example). [interaction-design] [human-computer-interaction]

## 5. Targets (Fitts's law)
- MT = A + B·log₂(2D/W): bigger, closer targets are faster to hit. Put primary and frequent targets near the "prime pixel": screen center or the last-clicked control. [fitts-law]
- Enlarge hit areas with padding, not bigger text. Space Save and Cancel close enough to compare but far enough apart to avoid misclicks. Make Submit stand out and its target larger than neighboring targets. [fitts-law]
- On mobile, keep primary actions in the thumb zone (center or bottom, not top-left). Bottom navigation and search help. [fitts-law] [creating-accessible-and-inclusive-design]
- Make primary menu items larger and mark the current one. Put frequent navigation near the starting point. [fitts-law]
- Push less critical items into the "magic pixel" corners. [fitts-law] ⚠ Classic HCI treats physical screen corners as the *easiest* mouse targets. In a browser viewport, treat corners only as far from the prime pixel.
- The source says there is no hard rule on button size. [fitts-law] ⚠ Enforce at least 24×24 CSS px (WCAG 2.5.8 AA); prefer 44×44.
- Validate with task time, error rate and user paths, not just click-through rate. [fitts-law]

## 6. Button and interactive states
- Keep **type** (submit/reset/toggle/CTA), **style** (primary/secondary/ghost/outlined) and **state** separate. [button-states]

| State | Treatment | Selector |
|---|---|---|
| Default | Looks clickable without hover; label states the result | `.btn` |
| Hover | Subtle darken, shadow lift or border change | `:hover` (none on touch) |
| Active | Darker fill, scale 0.98 or inset shadow | `:active` |
| Focus | Visible 3px outline + offset | `:focus-visible` (not `:focus`) |
| Disabled | Muted fill, not-allowed cursor, still visible | `:disabled` / `aria-disabled` |
| Loading | Spinner (short) or progress bar (measurable); block duplicate submits | `.is-loading` |
| Success | Green + checkmark, brief; "Saved/Sent/Done", not "Success" | `.is-success` |
| Error | Red fill/border + warning icon; resets to clickable; inline cause and fix | `.is-error` |
| Selected | Filled/inverted; stays on until toggled off | `[aria-pressed="true"]` |
[button-states]
- Never ship `outline: none` without a replacement focus style. [button-states] ⚠ The source says WCAG 2.2 *requires* a focus-indicator size and contrast; that's AAA (2.4.13). At AA, the indicator must be visible (2.4.7), not hidden behind other content (2.4.11), and should have 3:1 contrast (1.4.11).
- Explain a disabled button with a tooltip or inline message. Disable the button while it loads. [button-states] ⚠ A native `disabled` button gets no focus or hover, so its tooltip is unreachable and keyboard focus drops. Use inline text and `aria-disabled` + `aria-busy`, and announce results in a live region.
- Write errors as cause + next step: "Payment failed. Check your card details and try again." [button-states]
- Add a tooltip to a toggle when its icon changes, its action is irreversible or its effect is off-screen. [button-states]
- Meet 4.5:1 text contrast in **every** state. Never signal state by color alone; add an icon, a border-weight change or an underline. [button-states]
- Keep transitions at 100–200ms, subtle and purposeful. [button-states]
- Before building, draw a state diagram that "explodes" each screen into every state combination. Document outcomes ("payment fails → button resets + message"), unhappy paths included. [button-states]
- Touch screens have no hover, so active and loading states carry the feedback. Rage clicks mean a loading or disabled state is broken. [button-states]

## 7. Interaction and feedback
- Check five dimensions: words (action labels, errors with next steps), visuals (conventional icons: trash = delete), device and input, time (transitions, progress), behavior (predictable, recoverable). [interaction-design] ⚠ The source's example label is "Submit"; prefer specific verbs ("Create account").
- Follow Shneiderman's rules: consistency, shortcuts for experts, feedback, closure messages ("Purchase confirmed"), errors with fix guidance, undo, user control/customization, low memory load. [human-computer-interaction]
- Show affordances (buttons look pressable) and constraints (gray out unavailable options). Give every action visual, audio or haptic feedback. Show progress or a loading state for every wait. [interaction-design]
- Make undo easy and reuse familiar patterns so users need no tutorial. Add search and keyboard shortcuts where they help. [what-is-ui-design] [what-is-ux-design] [ui-design-principles]
- Design for context (lighting, network, offline). [human-computer-interaction]
- For AI features, show which fields the AI will fill and let users choose them. The human stays in control. [human-centered-design]

## 8. Accessibility and inclusion
- Cover the basics: alt text on every image; adequate padding; assistive-technology compatibility; keyboard navigation with a correct tab order; sufficient contrast; captions on video. [ui-design-principles] [what-is-ui-design] [what-is-ux-design]
- Build accessibility into components from day one: contrast, focus states, semantic structure, target size. Retrofitting forces structural rework. [what-is-product-design]
- Plan for color-vision deficiency: orange and green can look identical with protanopia, so never separate meaning by hue alone. Check contrast with tools. [creating-accessible-and-inclusive-design]
- Improve readability with higher contrast, larger text, shorter lines, careful leading and kerning, and legible typefaces. Plan for dyslexic and CVD users. [creating-accessible-and-inclusive-design] [constraints-in-design]
- Let users control text and image size. [what-is-visual-hierarchy]
- Test with the keyboard only and with a screen reader. [creating-accessible-and-inclusive-design]
- Don't assume abilities; older users rarely self-identify as disabled. Involve disabled users early. [creating-accessible-and-inclusive-design] [what-is-product-design]

## 9. Content, localization, performance
- Design with real or near-final content; placeholder mocks break when real text runs longer. Map content first to avoid unnecessary or duplicate pages. Make placeholders obviously provisional. [content-research]
- Write copy as you'd speak it: simple, read aloud, no jargon, less is more. [content-research]
- Leave room for text expansion (German can break a fixed-width button). Support RTL and varied literacy. Icon meaning varies by culture. [design-ethics] [constraints-in-design] [simplicity-design-principles]
- On mobile, use larger text and shorter lines, and minimize image, video and bundle size for slow, metered networks. [constraints-in-design]
- Compress images, choose the right formats and make graphics responsive; this affects SEO. [what-is-graphic-design]
- Use only licensed fonts, icons and photos. [content-research]

## 10. Design tokens and architecture
- Never hard-code hex or px in components; reference tokens. [design-tokens]
- Layers:
  - **primitive**: raw values (`blue-100`, `space-4`, spacing 2–64px);
  - **semantic/alias**: role names (`action-color`, `text-secondary`, `color/text/disabled`);
  - **component**: per-component values (button background, card radius, input padding).
  
  [design-tokens]
- Name tokens for their role, not their appearance: `text-secondary`, not `gray-text`. [design-tokens]
- Semantic tokens point only to primitives, never to other semantic tokens. [design-tokens]
- Name with **category/role/variant**: `color/action/primary` becomes `--color-action-primary`. Use one convention everywhere. [design-tokens]
- Build primitives first (color, spacing, typography). Then add semantic tokens for text, background, border and action. [design-tokens]
- Theme with modes: the semantic name stays the same and the mode swaps the primitive. `text-primary` = `gray-900` (light) / `gray-100` (dark). Use modes for brands and platforms too (e.g. different radius per platform). Components never fork per theme. [design-tokens]
- Two layers (primitive + semantic) are enough on one platform with a modest library. Add a component layer only when one role must render differently per component (button vs badge vs focus ring) or decisions are still settling. [design-token-architecture]
- Publish semantic tokens and keep primitives private, so consumers see `color.background.primary`, not 12 blues. Test: publish a token only if it represents a decision someone downstream makes. [design-token-architecture]
- Distribution [design-tokens] [design-token-architecture]:
  - Store tokens as JSON (W3C DTCG format) in git.
  - Pipeline: check → build per-platform formats → test → publish.
  - High-risk changes (brand primary) need PR review and a preview environment.
  - Notify consumers through chat, a changelog or PR comments.
- Add architecture only for multiple platforms, multiple contributing teams, change bottlenecks or existing CI/CD. Encode the token taxonomy in an agent skill so AI uses variables, not literal values. [design-token-architecture]

## 11. Design systems
- A system has four parts: components, tokens, patterns, and docs on how and when to use each. [design-system-examples]
- If a system exists, build only from its components, colors and type. Add no new elements of a kind it already has. Every screen should feel like one product. [using-an-existing-system]
- References: Material 3, Carbon (accessible enterprise), Polaris (commerce), Atlassian (multi-app), HIG. [design-system-examples]
- Governance [enterprise-design-systems]:
  - Allow flexible composition but lock tokens.
  - Write usage rules for look-alike components; otherwise teams flip filled Save and outlined Cancel.
  - Contributions go propose → owner review → publish with docs, with a retirement timeline. Use the lightest governance that stops drift.
- Adoption [enterprise-design-systems]:
  - Name components the way teams talk and document the reasons behind them.
  - Watch detach rates and duplicate local components.
  - Use slots instead of forks for icon swaps.

## 12. Design-to-code handoff
- Map design components to real code components: exact import path, prop names matching variant names. Never recreate styles from auto-generated CSS. [automated-ui-handoff]
- Align names between design and code (`Button/Primary/Large` vs `PrimaryButton` wastes time). [automated-ui-handoff]
- Pull exact specs and variables from the source (Figma MCP / Dev Mode); don't guess. [automated-ui-handoff] [design-token-architecture]
- Specs don't carry intent, so document behavior and edge cases. Keep mappings current and review what ships against the design. [automated-ui-handoff] [what-is-product-design]

## 13. Aesthetics and skeuomorphism
- Functionality comes before polish; a beautiful design on broken interactions is still broken. [what-is-product-design]
- Aesthetic-usability effect: attractive UIs only *feel* easier. Polish, including AI-generated polish, is not proof of usability. [what-are-design-aesthetics] [user-centered-design-questions]
- Start minimal, include only relevant elements, and let form support content. [what-are-design-aesthetics]
- Stay mostly flat and add a little skeuomorphism (shadows, layers, motion) for affordance. Avoid dated metaphors (the floppy disk), clutter and heavy detail that slows loading. [what-is-skeuomorphism]
- Neumorphism means "subtle shadows, low-contrast colors". [what-is-skeuomorphism] ⚠ Control boundaries under 3:1 fail WCAG 1.4.11.

## 14. Ethics and data
- Before designing, ask who the audience is and whether the problem is already solved. [design-ethics]
- Never sell or share user data without explicit opt-in. Explain where data goes before first use and provide deletion controls. [design-ethics]
- Counter your own bias and design for people unlike you. [design-ethics] [what-is-design-research]
- (The sources give no dark-pattern specifics.)

## 15. Research, validation, metrics
- Methods by phase:
  - **Strategy:** personas, interviews, card sorting.
  - **Design:** task analysis, eye tracking, surveys.
  - **Post-launch:** A/B tests, analytics, usability bug testing, diaries.
  
  Quantitative research shows *what* happens; qualitative shows *why*. [ux-design-research-methods]
- Ask open-ended questions about past behavior, not "what do you want?". Users describe solutions, so trace them to the root need with the 5 whys. [what-is-design-research] [what-is-product-design] [what-is-design-thinking]
- Get consent, compensate participants and meet them in their own environment. Study competitors but never copy them. [what-is-design-research]
- Track task success per feature together with time on task. CSAT and NPS lag. Also track conversion, abandonment and feature usage through events, heatmaps and recordings. [ux-for-product-managers] [what-is-design-thinking]
- A drop-off shows *what* happened. Ask what the user was trying to do when they stopped. Treat AI synthesis as a starting point and check it against transcripts. [user-centered-design-questions]
- Frame feedback by outcome ("Does this reduce onboarding friction?"), not taste. [ux-for-product-managers]

## Checklists
- **Design brief** [how-to-create-a-design-brief]: title, lead, stakeholder; overview and scope; goals; problem statement; competitors; brand guidelines (logo, color, fonts, images, file links); messaging and tone; audience; budget; timeline; deliverables (formats, screen sizes, resolutions).
- **Storyboard / flow spec** [how-to-create-a-ux-storyboard]:
  1. Set one goal.
  2. Pick one persona and write a one-sentence scenario ("A user with low vision uses zoom while checking out").
  3. List steps from entry to confirmation; each panel gets a number + title, caption and arrows.
  4. Cut redundant steps and add missing ones.
  
  Use horizontal panels for desktop and vertical for mobile.
- **Design thinking** [what-is-design-thinking] [human-centered-design]:
  - Stages: Empathize → Define (problem statement, 5 whys) → Ideate → Prototype & test → Implement (track KPIs, keep iterating). Loop back as needed.
  - Every idea must be desirable, feasible and viable.
- **Phase questions** [user-centered-design-questions]:
  - *Discovery:* Who is it for? What do we know versus assume? What do users do today, and in what context (device, environment, time pressure)?
  - *Design:* Real goal or symptom? Beyond the happy path? Works for all abilities and devices?
  - *Test:* Can users succeed without instruction? Where do they hesitate?
  - *Live:* Where do they drop off? What's next?
- **Reviewing AI output** [user-centered-design-questions]: Does it match what we know about users? Is it the right problem? Which assumptions are unvalidated? What real evidence supports it? Would a first-time user get it unaided?
- **UX success (Morville)** [difference-between-ui-and-ux]: useful, usable, desirable, findable, accessible, credible, valuable.
- **Screen goals** [getting-started-in-design]: business goal, readability, usability.
- **UX strategy** [what-is-ux-strategy]: goals tying business to users → validate (stakeholders, competitors, personas, support tickets) → evaluate and ideate → roadmap, then iterate.
- **Ideation** [lateral-thinking-explained]: SCAMPER (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse), six thinking hats, reverse brainstorming, random words.

## Numbers & thresholds

| Value | Rule | Source |
|---|---|---|
| 4.5:1 | Text contrast on buttons, every state | button-states |
| 44×44 px | Minimum tap target (⚠ AA floor is 24×24, WCAG 2.5.8) | button-states |
| 3px + offset | Focus ring | button-states |
| 0.98 | Active-state scale | button-states |
| 100–200 ms | State transitions | button-states |
| 5 + 4 | Core states + functional states (loading, success, error, selected) | button-states |
| MT = A + B·log₂(2D/W) | 60px target 100px away, A=0.4, B=0.2 → ≈0.75 s | fitts-law |
| 3–5 taps | Most taps a standard action should take | simplicity-design-principles |
| 2–3 | Type styles per product | consistency-in-design |
| 1 + 1 + tones | Primary + secondary color, tones of each, plus black and white | consistency-in-design |
| 1:1.618 | Golden ratio; 1000×618; guides at 618/382/236 | golden-ratio |
| 2–64 px | Example spacing primitive range | design-tokens |
| category/role/variant | Token name pattern → `--color-action-primary` | design-tokens |
| gray-900 / gray-100 | `text-primary` in light / dark | design-tokens |
| 2 (or 3) | Token layers: primitive + semantic; component only if justified | design-token-architecture |
| `color.blue.600`, `spacing.16`, `font.size.300` | Example token names | design-token-architecture |
| 1 in 12 men, 1 in 200 women | Color blindness, so never encode by hue alone | creating-accessible-and-inclusive-design |
| A few dozen | Customers to recruit as an ongoing panel, mixed skill levels | human-centered-design |
| 1 goal, 1 persona | Per storyboard; scenario = one sentence | how-to-create-a-ux-storyboard |

Coverage: 40/40 files read (none unreadable).
