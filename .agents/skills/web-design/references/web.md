# Web design: distilled rules for coding agents

Source: 29 Figma Resource Library articles, "Design basics → Web design" (figma.com/resource-library/<slug>/). `[slug]` = source. ⚠ = conflicts with WCAG 2.2 AA, Core Web Vitals or current practice; the reason follows. Figma product how-tos, example lists and trivia are removed.

## 1. Site structure & IA
- Settle structure before visuals. Give each page one purpose tied to a user goal (personas, journey map). [how-to-make-a-business-website]
- Choose a model: tree (business, e-commerce, info sites), linear with next/previous (onboarding, tutorials, multi-step forms), matrix (knowledge bases, portfolios), database (large catalogs and news, via filters and search), or a hybrid for large sites. [website-structure]
- Order: sitemap → group related content → minimal clicks to key pages → wireframes → visuals. [website-redesign]
- Keep menus short with descriptive labels, the same on every page and device. No orphan pages. [website-structure]
- Breadcrumbs: start at Home, mirror the hierarchy, sit near the top, every step clickable. [website-structure] [mobile-website-design]
- URLs: short hyphenated keyword slugs that mirror the hierarchy (`/blog/web-design/structure-tips`, not `?id=123`). [website-structure]
- Plan internal links. Audit 404s regularly. Merge duplicate pages, or else use `rel=canonical`. [website-structure]
- Footer: secondary nav, contact, social, ©, and quick links to the most-requested tasks. [website-structure] [ai-website-examples]
- Large portals: prominent search, nested menus, persona entry cards ("students", "business owners"). [ai-website-examples]
- Use the landmarks `<header> <nav> <main> <footer>`. [web-design-and-development]
- Conventions: logo top-left and linked home, horizontal header nav on desktop, social icons in the footer. [design-statistics] [mobile-website-design]

## 2. Layout & grid
- Prefer a soft grid (consistent base-unit spacing) to a hard print grid. [web-design-grid-layout-examples]
- Base unit 0.5 or 1rem (8 or 16px); every size and gap is a multiple. Use rem, not px. 4px text baseline. [web-design-grid-layout-examples]
- Column grids: 3–12 columns, with 3 the cited sweet spot. [web-design-grid-layout-examples] [website-layout-ideas]
- Margins: small on mobile (content never touches the edge). On desktop, flexible with a capped text measure. Asides in the extra desktop margin collapse on small screens. [web-design-grid-layout-examples]
- Fit layout to content [website-layout-ideas]:
  - single column: articles, About
  - card/modular grid: products, galleries
  - column grid: pricing comparison
  - split screen: form beside plan summary
  - asymmetric: CTA in the larger half
  - full-screen hero: only with legible overlaid text
  - zig-zag: feature rows ending in a CTA
  - F-pattern for long-form, Z-pattern for sparse pages
  - side-scroll: only with visible arrow buttons
- The most important element gets the most visual weight (size, color, contrast). [website-layout-ideas]
- Grid baseline: `repeat(auto-fit, minmax(250px,1fr))` with gap 16px; wrapping flex `flex:1 1 200px; min-width:150px`. [responsive-website-design]
- Components reorder and resize from their content (stack/wrap), not fixed positions. [web-development-trends]
- Dashboards: KPIs first, then tables. Filters across the top, sticky sidebar, color-coded status tags. ⚠ Give each status color a text label or icon (WCAG 1.4.1). [ai-website-examples]
- ⚠ Cards that reveal info on hover [website-layout-ideas]: also show it on focus and tap, and never hide essential info. Touch has no hover, and WCAG 1.4.13 applies.

## 3. Responsive & mobile-first
- Start with a content audit. Ship essentials at the smallest width, then enhance upward deliberately, or desktop ends up sparse. [mobile-first-design]
- One responsive URL; no `m.` subdomain. [mobile-website-design]
- The basics: fluid grids in relative units, flexible media, media queries, responsive type and nav. [responsive-website-design]
- Media: `img,video{max-width:100%;height:auto;display:block}`. [responsive-website-design]
- ⚠ The article's `clamp(1rem,10vw,3rem)` is vw-only in the middle, so text ignores zoom (WCAG 1.4.4). Use `clamp(rem, rem + vw, rem)`. [responsive-website-design]
- Tailwind: mobile styles unprefixed, breakpoint prefixes upward. [responsive-website-design]
- Design and test from 360px wide (360×800 is the most common mobile resolution). [web-design-statistics]
- Test on real devices, not only emulators. At every breakpoint, check text size, tap targets, clutter and unscaled images. [pricing-page-best-practices] [responsive-website-design]
- Google indexes the mobile version first, so keep mobile content at parity. [mobile-first-design]
- ⚠ The article builds its nav toggle in jQuery. Use CSS plus a native button with `aria-expanded`/`aria-controls`. [responsive-website-design]

## 4. Mobile specifics
- Single column, short scannable copy, readable sans. [mobile-website-design]
- Touch targets at least 44×44px with spacing, above the WCAG 2.2 AA minimum of 24×24. [mobile-website-design]
- Primary CTA and essential info (location, hours, booking) go on the first screen; average mobile scroll depth is 45%. [mobile-website-design] [responsive-website-design] [design-statistics]
- Use banners or inline messages, not pop-ups. If one is unavoidable, make it easy to close. [mobile-website-design] [mobile-first-design]
- Long pages get "back to top". The logo links home. [mobile-website-design]
- Thumb-reach nav (bottom bar or hamburger). Content-heavy sites can use a fixed top bar, with alternating section backgrounds to split long text. [mobile-first-design] [mobile-website-design]
- ⚠ Wide tables: the article suggests `<div>`s. Keep a semantic `<table>` inside a focusable, labelled `overflow-x:auto` wrapper. [mobile-website-design]
- Tooltips: tap or click to open, behind an "i" or "?" icon, since hover fails on touch. [pricing-page-best-practices]
- ⚠ Sticky header or CTA bars must not hide the focused element (WCAG 2.2, 2.4.11); set `scroll-padding`. [pricing-page-best-practices]
- ⚠ Images used as buttons need accessible names and a visible affordance. [mobile-first-design]

## 5. Navigation & hamburger
- Use a hamburger for small screens, minimalist UIs, secondary items, and audiences that know the pattern. [hamburger-menu]
- Avoid it for complex structures, primary pages that must stay visible, when quick access matters, or in interaction-heavy UIs. [hamburger-menu]
- Costs: lower discoverability and clicks, an extra step, screen-reader barriers. [hamburger-menu]
- Build rules [hamburger-menu]:
  - Standard three-line icon, consistently top-left or top-right.
  - Priority items first, related items grouped, arrows on submenus.
  - Feedback on selection and hover.
  - Keyboard-operable, with ARIA labels.
- Alternatives: tabs (few categories), side nav (many subcategories), slide-out drawer, vertical dropdowns. [hamburger-menu]
- ⚠ Collapse only below the desktop breakpoint (the example uses ≤768px). Desktop shows a visible horizontal nav, as 90% of sites do. [responsive-website-design] [design-statistics]
- One-page sites: sticky nav with jump links. [one-page-website]
- ⚠ Experimental nav (radial menus, hidden drawers, nonlinear maps) hurts discoverability and keyboard access. Showpieces only, with a fallback. [web-design-trends]

## 6. Site type decisions
- **One-page**: launches, campaigns, events, simple small businesses, portfolios. **Multi-page**: many offerings, e-commerce, many SEO keywords. One-page risks: overload, weak multi-keyword SEO. [one-page-website]
- One-page skeleton: header → hero (headline and subhead) → sections → CTA → footer (contact, social, ©), with one CTA in both header and footer. [one-page-website]
- **Static** (pre-rendered): portfolios, landing pages, docs, brochure sites. Faster, more secure, cheaper. **Dynamic**: logins, personalization, CMS updates, search, e-commerce, data collection. [static-vs-dynamic-website]
- Decide by: goal → update frequency, interactivity and data → budget and time → team skill → scale. [static-vs-dynamic-website]
- SSR or static for content and SEO pages, CSR for highly interactive views. [web-design-and-development]
- Server-first (RSC/SSR) by default: ship only the JS interactivity needs, and decide static vs client per component up front. Content-heavy sites: headless CMS. [web-development-trends]

## 7. Landing pages
- One goal per page; minimize or remove top-level nav. [landing-page-examples]
- Headline = the biggest problem solved or the transformation, not features. Headline and CTA dominate visually. [landing-page-examples]
- Match the copy to the ad or link that brought the visitor. [landing-page-examples]
- Primary CTA above the fold, high contrast, action verb ("Start Your Free Trial", "Get a Quote"). [landing-page-examples]
- Lower friction: free tier, trial or consultation. Early-bird offers state their expiry. [landing-page-examples]
- Trust signals sit next to forms and CTAs: testimonials, ratings, logos, badges, a privacy link. [landing-page-examples]
- Frame services as solutions ("We help teams fix inconsistent messaging"). Offer a lead magnet: checklist, audit, quiz or calculator. [landing-page-examples]
- Local services: neighborhoods served, area map, delivery radius and cutoff. Events: date, time and location in the hero, map, parking. Professional firms: headshots, bios, credentials. [landing-page-examples]
- Show the real product UI rather than stock photos. [ai-website-examples]
- ⚠ Header video or reels: muted, with a pause control (WCAG 2.2.2), respecting `prefers-reduced-motion`, with a poster image for LCP. [landing-page-examples] [ai-website-examples]
- Avoid hero carousels: they test poorly, yet 42% of business homepages still use one. [design-statistics]

**Landing checklist** [landing-page-examples] [one-page-website] [call-to-action-examples] [ai-website-examples]
1. Header: logo, minimal nav, CTA
2. Hero: benefit headline, subhead, CTA, product visual
3. Logos or ratings
4. Features as benefits (zig-zag or cards)
5. Process steps
6. Testimonials with numbers
7. Pricing or offer
8. FAQ accordion
9. Oversized final CTA
10. Footer: contact, privacy, social

## 8. CTAs
- Clarity over cleverness. One specific verb per action ("Shop best-sellers", "Book a demo", "View Docs"), never a generic "Submit". [call-to-action-examples]
- Direct CTAs for the primary action, indirect ("Learn more") for exploration; place them side by side for different intents. [call-to-action-examples]
- Copy gets more specific down the page: "Get started" → "Get started with X". [call-to-action-examples]
- Place one above the fold, one mid-page and an oversized one at the bottom, plus a sticky CTA for the key action. [call-to-action-examples]
- Contrast plus white space; size in proportion to the viewport. [call-to-action-examples]
- Lead-in copy answers "why click?". Put friction reducers at the button: "no credit card required", "cancel anytime", rating. [call-to-action-examples] [pricing-page-best-practices]
- A/B test color, placement and copy. [call-to-action-examples]
- ⚠ Countdown pop-ups, all-caps "FREE" and manufactured scarcity [call-to-action-examples]: use real urgency only (fake urgency is a dark pattern [web-design-trends]); uppercase via CSS; pop-ups need a focus trap, visible close and Esc, and must not be intrusive on mobile.

## 9. Pricing pages
- 3–4 tiers, lowest to highest commitment, named consistently (by level or persona). [pricing-page-best-practices]
- 4–6 benefit-led features per plan; "Everything in [previous], plus…". [pricing-page-best-practices]
- Badge one plan ("Most popular"/"Best value") in a contrasting color, usually the middle one (decoy effect). [pricing-page-best-practices]
- Whole-number prices with the unit beside them (/month, /user), no hidden fees. Show annual savings on the toggle's annual side, with the toggle next to the plans it affects. [pricing-page-best-practices]
- Usage pricing: slider calculator, "starts at", "Contact sales" for enterprise. Show prices publicly for B2C and self-serve SaaS. [pricing-page-best-practices]
- Strongest proof next to the CTAs: short outcome testimonials and logos. [pricing-page-best-practices]
- Comparison table: decision-driving features first, grouped and labelled, checkmarks and tooltips instead of prose, sticky labels or accordions when long. [pricing-page-best-practices]
- Mobile: stack the cards, swap the table for accordions, add a sticky bottom CTA. [pricing-page-best-practices]
- CTA copy: "Start for free" (trial), "Get started" (paid), "Book a demo"/"Talk to sales" (high tiers). Every tier has a CTA visible on load. [pricing-page-best-practices]
- Track bounce, time on page (too low and too high are both bad) and CTA conversion. [pricing-page-best-practices]

**Pricing checklist** [pricing-page-best-practices]
1. Value headline
2. "Who it's for" subhead
3. Billing toggle
4. Up to 4 cards: description, price and unit, badge, CTA
5. Proof near the CTAs
6. Grouped comparison table
7. About 5 FAQs (1–3 sentences each): billing, cancellation, contracts, plan changes, trials, payment, hidden fees, security
8. Sticky CTA

## 10. Site-type patterns
- **Business pages** [how-to-make-a-business-website]:
  - Home: message, hero, CTA
  - About: mission, team, awards
  - Products/services: images, comparison, testimonials, CTA
  - Contact: map, chat
  - FAQ: accordion plus search
- **Service business** [ai-website-examples]:
  - CTA in the hero
  - Service grid with icons
  - Team photos and testimonials
  - Area map with a ZIP check
  - Emergencies highlighted
  - Contact form on every page
- **E-commerce** [ai-website-examples]:
  - Cards with photo, price, rating, tags and key specs
  - Search and filters at the top
  - Categories run broad → specific
- **Portfolio** [portfolio-website-examples]:
  - Curate current work that matches target projects.
  - Case study = role, problem, process and iterations, measurable impact, learnings, in phases (discovery → strategy → impact).
  - Contact and resume visible from the first screen.
  - Testimonials; update regularly.
- **Developer portfolio**: resume and contact in the hero, filterable tech tags, timeline, closing contact form. [ai-website-examples]
- **Personal site**: bio, work samples, writing, contact, CV, testimonials. [personal-website-examples]
- ⚠ Showpiece portfolios (3D game nav, shaders, zoom-on-scroll, typewriter text, moving backgrounds) only when the site is the skill demo. Provide plain nav and a reduced-motion fallback, and budget for LCP and INP. [portfolio-website-examples] [ai-website-examples]

## 11. Color
- 2–3 primary brand colors plus a few accents. The boldest accent is reserved for CTAs and interactive elements. [how-to-make-a-business-website] [website-color-schemes]
- A neutral base plus one vivid accent is the most reusable pattern; use saturated colors sparingly. [website-color-schemes]
- By industry: neutral for luxury and readability, warm for food, entertainment and home, cool blue or gray for finance, tech, health and legal, vibrant for fashion, gaming and kids. [website-color-schemes]
- Use the darker shades for hierarchy and text contrast. [website-color-schemes]
- Plan light and dark palettes up front and implement them with tokens or CSS variables. [web-design-and-development] [web-design-trends]
- Check contrast at kickoff: low-contrast text is the #1 failure (79.1% of homepages). [web-development-trends] [web-design-statistics]
- Keep one palette across site, pricing, social and ads. Test palettes; treat color psychology as a heuristic. [pricing-page-best-practices] [instagram-story-ideas] [website-color-schemes]
- ⚠ Glassmorphism, neumorphism and neon-on-dark: verify 4.5:1 text and 3:1 non-text contrast over every background. Neumorphism usually fails 1.4.11. [ai-website-examples] [web-design-trends]

## 12. Redesign
- A refresh changes visuals and minor UX; a redesign changes architecture, function and UX. [website-redesign]
- Signals: dated look, high bounce or confusing nav, slow pages or errors, falling conversions, security debt. [website-redesign]

**Redesign checklist** [website-redesign]
1. Audit performance, behavior (bounce, paths), conversions (forms, CTAs, cart) and IA/flows
2. Competitor and gap analysis
3. Research: support tickets, path tracking, usability tests, journey maps
4. Baseline metrics plus SMART targets
5. Scope, timeline, budget, personas
6. Sitemap → wireframes → visuals → responsive prototypes
7. Test with real users
8. Legacy code: keep or replace, keeping the backend running
9. Phased rollout
10. Monitor and iterate

## 13. Build, performance, SEO, accessibility
- **Build order** [how-to-make-a-business-website] [web-design-and-development] [one-page-website]:
  1. Discovery
  2. Sitemap
  3. Wireframes, low → high fidelity
  4. Design system
  5. Prototype and test
  6. Front end, then back end
  7. QA: responsiveness, performance, broken links, typos
  8. Soft launch
  9. Heatmaps, A/B tests, content updates
- **Performance**:
  - Compress images: AVIF/WebP for photos, SVG for graphics. Limit animations, cut third-party scripts, code-split. [mobile-website-design] [mobile-first-design] [web-design-and-development]
  - Use native Baseline features (popover, dialog, scroll-driven animation) instead of custom JS. [web-development-trends]
  - Spec transition states, and use motion to mask latency. [web-development-trends]
  - Check PageSpeed Insights; CWV affect ranking. [one-page-website] [web-design-and-development]
- **SEO**: keywords in title, meta, headings and body; alt text, internal links, clean URLs, canonicals; no broken links. [one-page-website] [website-structure] [web-design-and-development]
- **Accessibility** [web-design-statistics] [web-development-trends] [mobile-website-design]:
  - Semantic HTML, keyboard-only testing, alt text, contrast.
  - Label every input (labels are missing on 34.2% of homepages).
  - Test with a screen reader as often as you check mobile.
- Prefer native elements to ARIA (pages using ARIA average 2× the errors). Don't rely on overlays: over 1,000 lawsuits in 2024 hit sites that used one. The EAA has been enforced since June 2025. [web-design-statistics]
- Audit every AI- or vibe-coded page, since they often miss accessibility. Avoid dark patterns. [web-development-trends] [web-design-trends]
- Trim checkout fields: the average US checkout has 23.48 elements, about 2× the ideal. [design-statistics]

## 14. Trends: durable or fad
| Trend | Verdict | Guidance |
|---|---|---|
| Light + dark themes | Durable | Both, via tokens [web-design-trends] |
| Functional motion, micro-interactions | Durable | ⚠ reduced-motion, keep INP low [web-development-trends] |
| Accessibility, lean pages | Durable (legal) | Required [web-design-trends] |
| Server-first, full-stack frameworks, TypeScript | Durable | Default stack [web-development-trends] |
| Component-driven layouts, headless CMS | Durable | [web-development-trends] |
| Oversized typography | Durable-ish | ⚠ preload fonts, avoid swap CLS [web-design-trends] |
| Bento grids | SaaS staple | 1 column on mobile [ai-website-examples] |
| 3D/WebGL, AR | Situational | ⚠ lazy-load, poster fallback [web-design-trends] |
| Gamification | Situational | Learning, loyalty [web-design-trends] |
| Parallax, infinite scroll, scrollytelling | Fad-prone | ⚠ reduced-motion; reachable footer [web-design-and-development] |
| Maximalism, retrofuturism, collage, neo-brutalism, dopamine palettes | Fad | Brand-led only; check contrast [web-design-trends] |
| Neumorphism, glassmorphism | Fad | ⚠ contrast [web-design-trends] |
| Experimental navigation | Fad | ⚠ discoverability [web-design-trends] |
| Generic AI "prompt box" | Fad (per source) | Build AI into the task UI [web-development-trends] |
| Voice UI, adaptive forms | Emerging | Optional [web-design-trends] |

## 15. Vibe coding, AI site building, MCP
- Workflow [vibe-coding-examples]:
  1. Map the logic: flows, states, data.
  2. Build a visual source of truth: core screens, components, tokens.
  3. Generate, then click every state against the flow and refine the prompt.
  4. Move the code into the repo and wire the backend.
- Prompt = vibe (mood, type and color direction) + function (layout, components, behaviors, data). State the logic explicitly ("list filterable by date"). [what-is-vibe-coding] [no-code-app-examples]
- Iterate with targeted edits, not regenerations. [what-is-vibe-coding]
- Output is a draft: results are inconsistent and imprecise, and accessibility and performance need explicit passes. [what-is-vibe-coding]
- Stress-test with realistic data, full lists, both themes and larger tap targets. [ai-website-examples]
- Before polish, do a "vibe check": mood, intuitiveness, distractions, fit with needs. [what-is-vibe-coding]
- MVP = the smallest usable feature set that proves the concept. [no-code-app-examples]
- Give agents structured design context (variables, components, styles, annotations) via MCP. Screenshots yield only rough prototypes. [what-is-mcp] [web-development-trends]
- MCP servers expose resources, tools and prompts, with tool discovery. Prefer an existing server to custom API glue. [what-is-mcp]

## Numbers & thresholds
"Mkt" = marketing statistic: context only, not a rule.

| Value | Use | Source |
|---|---|---|
| ≥44×44px | Touch target | mobile-website-design |
| 8 / 16px (0.5 / 1rem) | Spacing base unit | web-design-grid-layout-examples |
| 4px | Text baseline | web-design-grid-layout-examples |
| 3–12 columns; 3 = sweet spot | Column grid | web-design-grid-layout-examples |
| 600px / 768px | Example breakpoints: hide sidebar / collapse nav | responsive-website-design |
| `minmax(250px,1fr)`, gap 16px | Card grid | responsive-website-design |
| `clamp(1rem,10vw,3rem)` ⚠ | h1 fluid type; add a rem term | responsive-website-design |
| 360×800 | Most common mobile resolution | web-design-statistics |
| 3–4 tiers; 4–6 features | Pricing cards | pricing-page-best-practices |
| ~5 FAQs, 1–3 sentences | Pricing FAQ | pricing-page-best-practices |
| 2–3 primary colors | Brand palette | how-to-make-a-business-website |
| 45% | Mobile scroll depth | design-statistics |
| 51.7% / 62% / 64% | Mobile traffic share (sources disagree) | design-statistics / mobile-first-design / pricing-page-best-practices |
| <3 s | Load time of 92% of top Google results | design-statistics |
| 1 s vs 5 s | 1 s loads convert 2.5× better | what-is-web-design |
| 2,362 KB / 632 KB JS | Median mobile page / JS: beat it | web-design-statistics |
| 48% | Mobile sites passing CWV | web-design-statistics |
| 79.1% / 34.2% / 94.8% | Homepages with low contrast / missing labels / WCAG failures | web-design-statistics, design-statistics |
| 2× | Errors on ARIA pages | web-design-statistics |
| June 2025 | EAA enforcement | web-design-statistics |
| 42% | Homepages with hero carousels (test poorly) | design-statistics |
| 93% / 90% | Logo top-left / horizontal header nav | design-statistics |
| 23.48 (~2× ideal) | Checkout form elements | design-statistics |
| 70.22% | Cart abandonment | design-statistics |
| +35.26% | Conversion from better checkout (Mkt) | web-design-statistics |
| +5.4% per +10% depth | Conversion (Mkt) | web-design-statistics |
| +202% | Personalized CTAs (Mkt) | call-to-action-examples |
| +3% | Conversion after a tested nav redesign (case study) | website-redesign |

Coverage: 29/29 files read, none missing. Low-yield files: instagram-story-ideas (cross-channel consistency only), design-statistics and web-design-statistics (mostly marketing), no-code-app-examples (MVP and prompt logic only).
