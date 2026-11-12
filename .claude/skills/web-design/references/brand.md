# Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles)

`[slug]` = source article. `⚠` = conflicts with or is missing from WCAG 2.2 AA, Core Web Vitals (CWV) or current web practice; the note says what to do instead. "Agent mapping" = a translation into site/code practice, not a source claim.

## 1. Style guide → tokens and docs
- Treat the style guide as the single source of truth for brand story, audience, voice, writing rules and visual elements, with explicit usage rules per channel. [how-to-design-a-logo] [what-is-a-style-guide]
- Capture all 5 elements. The third column is an agent mapping. [what-is-a-style-guide]

| Element | Must contain | Site artifact |
|---|---|---|
| Brand story | Why and how the vision, mission and values solve customer problems, in simple, authentic language | About page, hero copy |
| Target audience | Personas from user research | Tone, content depth, test scenarios |
| Visual identity | Typography and font sizes, logo usage, imagery, iconography, palette (RGB, HEX, CMYK) | Color and type tokens, logo component, icon set, image rules |
| Brand voice | An adjective set (e.g. "modern, clever, and brave, yet caring"); tone per channel | Voice and tone doc, microcopy |
| Writing guidelines | Readability level, grammar, approved words and phrases | Content style guide, copy lint list |

- Write specs and accessibility guidelines for both visual and copy components. [what-is-a-style-guide] ⚠ The source gives no contrast targets and no dark mode. Define every color token with a light and a dark value, and verify 4.5:1 for text and 3:1 for large text and UI (WCAG 1.4.3, 1.4.11). CMYK values are for print only.
- Add a table of contents, keep the guide to 25–35 pages, and link out for detail. Include real dos and don'ts that show the brand in different contexts. [what-is-a-style-guide]
- Publish v1 as soon as a few assets exist, without waiting for a rebrand, and update it every 6–12 months. [what-is-a-style-guide]
- Host it where everyone, freelancers included, can reach it and ask questions. Have stakeholders inside and outside the brand team review it, and use it in onboarding. [what-is-a-style-guide]
- Take palette, copy guidelines, fonts, images, icons and logos from the guide before building any asset. [how-to-design-a-flyer]

## 2. Logos on the web
Choose the type from brand identity, core message, audience and personality (playful, serious, sophisticated). [types-of-logos]

| Type [types-of-logos] [how-to-design-a-logo] | What it is | Best fit |
|---|---|---|
| Wordmark | The name in distinctive type | Short, unique names |
| Letterform | One letter, or stylized letters of the name | Known or playful brands |
| Monogram | Initials | Established, luxury |
| Pictorial | A standalone symbol | Recognizable without text |
| Abstract | Non-literal shapes | Modern; pair with a wordmark |
| Combination | Symbol plus name | The most flexible system |
| Emblem | Mark inside a badge | Tradition, institutions |
| Line drawing | Minimal strokes | Simplicity; scales well |
| Mascot | A character | Younger audiences |
| Animated / 3D / dynamic | Motion / depth / context variants | Digital-first, campaigns |

- Build a logo family: the full lockup (symbol plus name) in the site header, the symbol alone in small slots such as profile pictures. [how-to-design-a-logo] Agent mapping: the symbol-only version also covers favicons and app icons.
- Export SVG for the web, for scalability and clarity. [how-to-design-a-logo] ⚠ The source calls JPG and PNG print formats; that is dubious. Use SVG for the mark and PNG only where a raster is required (some favicons, social cards).
- Shrink-test the mark to app-icon size and remove any detail that vanishes. [types-of-logos]
- Use strong figure–ground contrast (never light blue on white) and test in monochrome. [types-of-logos]
- Make black-and-white versions. [types-of-logos] Agent mapping: ship a dark-on-light and a light-on-dark variant and swap them by theme. ⚠ The sources don't cover dark mode. Logotypes are exempt from WCAG 1.4.3, but a variant that stays legible is still expected.
- Keep the type legible at small sizes and avoid ornate letterforms. [types-of-logos] [how-to-design-a-logo]
- Lay out the mark with white space, clear hierarchy and alignment to a grid or baseline. [how-to-design-a-logo] ⚠ No source gives a number for clear space or minimum size. Define both in the style guide (as tokens) before use.
- Judge every option on simplicity, timelessness, uniqueness, relevance and readability. [how-to-design-a-logo]
- Process: identity questions (audience, mission, values, adjectives) → mood board, competitor scan → type → color and font (serif = timeless, sans = modern, script = elegant) → shapes (circle = unity, square = reliability) → mockups → peer review plus A/B survey of a few customers → variants → trademark check. [how-to-design-a-logo]
- ⚠ Animated and dynamic logos: provide a static fallback under `prefers-reduced-motion`. Never autoplay audio (WCAG 1.4.2). Motion that runs longer than 5 s needs a pause control (2.2.2). Never flash more than 3 times a second (2.3.1). Keep animation assets off the LCP path.
- ⚠ Not in the sources: give the header logo link an accessible name (the brand name).

## 3. Storytelling: landing and About pages
- Host the visit like a guest: welcome, then say who you are and what you offer in one plain line (e.g. "Find and book hotels in Nigeria"). [storytelling-in-design]
- Answer the visitor's questions in order: Where do I go? Is this for me? What is this? Who can help? How long will it take? Can I return it? Can I trust you? [storytelling-in-design]
- Follow the e-commerce skeleton: intro (logo, name, welcome) → featured products that represent the categories → a simple path (style, pick, customize, cart, checkout, post-purchase, support) → the returning and referral experience. [storytelling-in-design]
- Don't put everything on one page. Reveal details such as security or shipping speed when the user needs them; what you leave out matters as much as what you include. [storytelling-in-design]
- Use the narrative to defend design decisions to stakeholders. [storytelling-in-design]
- Build the About page from the plain-language brand story [what-is-a-style-guide], your "why", the team with each member's expertise, and a milestone timeline. [how-to-start-a-presentation] [presentation-ideas]
- Prefer original photography to generic stock; a photo series can chart a journey. [presentation-ideas]
- Put content first: write the real copy, group it by importance (Gestalt similarity and proximity), then choose type and layout. Lead with the most relevant item. [how-to-design-a-resume]

## 4. Narrative: hero → proof → CTA
- Map the 5-part arc to page sections: introduction (hero) → rising action (problem and stakes) → climax (the solution, shown with impact) → return (how the visitor achieves the CTA) → conclusion (summary plus CTA). [presentation-ideas]
- State the problem before the solution: validate the pain, then promise the answer. [how-to-start-a-presentation]
- Pick a hero hook: [how-to-start-a-presentation]
  - intellectual: debunk a myth, take a contrarian view, cite a statistic (visualized), ask a question, pose an unsolved problem, show the work
  - emotional: an anecdote, a real social post, your "why", humor, a quote (know its original context [presentation-ideas]), "Imagine…"
  - practical: an interactive demo, one high-impact visual or short loop, a poll
- In demos, lead with value to the visitor, not with features. [how-to-start-a-presentation]
- Build proof from real user posts and charted statistics [how-to-start-a-presentation], experts the audience knows [presentation-ideas], and large testimonial quotes and reviews. [how-to-make-a-brochure] [brochure-examples]
- End with one clear CTA that names the next step, plus a short summary of the key takeaways. [presentation-ideas]
- Match depth and tone to the audience. Use analogies for abstract ideas, diagrams for processes and timelines for sequences. Give each section one idea, and give long content a table of contents. [presentation-ideas]
- Emphasize sparingly: a neutral base with pops of color on key stats, bold color and type only where meaningful, consistent fonts and sizes (change them only for emphasis), two-tone palettes, dividers for dense content, and white space to direct focus. [presentation-ideas] ⚠ Pair color emphasis with weight or size (WCAG 1.4.1). Check bright accents (red, neon green, hot pink) for contrast. Use color-blind-safe chart palettes, which the source also advises.
- Treat the 7×7 rule [how-to-start-a-presentation] and the 5/5/5 rule [presentation-ideas] as slide heuristics; apply them only to hero and headline blocks.
- Keep animation subtle and purposeful. [presentation-ideas] ⚠ Respect `prefers-reduced-motion`, and use MP4/WebM rather than GIF (see §6).

## 5. Storyboarding flows and motion
- A storyboard is ordered frames, one moment or screen each, with notes on what happens and when. A wireframe is the layout of one screen; a storyboard is the sequence across screens. Sketch the sequence first. [storyboarding]
- Pick the type: [storyboarding]
  - UX: one screen per frame, with the user's action and where they land. Build it before design starts, to find stalls.
  - Motion: key moments, moving elements, transition durations, direction arrows; frames in the final aspect ratio (16:9 hero, 9:16 social).
  - Traditional: shots, camera moves and sound cues, for brand video.
- Write the beats as plain sentences, one line per frame, before drawing or generating anything. [storyboarding]
- Set up references (character, visuals, style guide) before generating frames, or the frames drift. Compare variants side by side. [storyboarding] Agent mapping: pass the style guide and tokens to any image generation.
- Annotate each frame with the shot and the prompt used; legibility beats finish. For animation, note key poses and shot durations, then check timing in an animatic first. [storyboarding] ⚠ Give every animated transition a reduced-motion path.

## 6. Transferable from print & media
- Before designing, define the goal, the audience, the action you want and how you will measure success. [how-to-design-a-flyer]
- Give the page one focal point: the headline, image or logo reads first through size, weight and placement. Put key information in the upper third or center, in priority order. [flyer-examples] [how-to-design-a-flyer]
- Ask for one prominent, literal action ("Call now", "Visit our website"). [how-to-design-a-flyer] [flyer-sizes]
- Make the key details (what, when, where, CTA) findable in under 30 s. Glance-test with a colleague; if they can't say what it is about, rework it. [flyer-examples] [how-to-design-a-flyer]
- Write a headline that states the main benefit. Use active voice, benefit-led wording and bullets, and don't bury the central message. [flyer-examples] [flyer-sizes] [brochure-examples]
- Use 1–2 fonts (a bold display face for headlines, a readable body face) and a limited brand palette with seasonal accents. Give strong contrast to only 1–2 key elements, and run a contrast checker. [how-to-design-a-flyer] [flyer-examples]
- Use white space generously. Split multi-part information into distinct sections (grid, layers, zig-zag), keep footers consistent and put complex data in charts. [flyer-examples] [how-to-make-a-brochure]
- Repeat contact details and the CTA where readers finish. [how-to-make-a-brochure]
- Match the tone to the audience: playful design misfits a professional market. [brochure-examples]
- Prefer no image to a blurry one. [how-to-design-a-flyer] ⚠ On the web, serve responsive AVIF/WebP via `srcset` with explicit width and height (to avoid CLS), and preload the LCP hero image.
- Proofread, and check that every link in the digital version opens. [how-to-design-a-flyer]
- Cinemagraph hero media: one region moves, the rest stays frozen. Shoot locked-off 5–10 s, match first and last frames, feather the mask, prefer a repeat loop to a mechanical bounce loop, keep the loop 2–5 s, export MP4/WebM (GIF is larger and bands) and check on a phone. [how-to-make-a-cinemagraph] ⚠ Use `muted playsinline` and a poster; show only the poster under `prefers-reduced-motion`; an endless loop exceeds WCAG 2.2.2's 5 s, so add a pause control; the poster is likely the LCP element.
- Write thank-you and confirmation copy as a greeting, specific thanks and a warm sign-off, in your own voice. Never be vague or generic; use humor only when it fits the recipient. [thank-you-card-ideas]
- Run kickoff workshops in sequence: lotus diagram (goal plus 8 ideas, pruned) → time-boxed agenda → fishbone for root cause → affinity clusters → argument-map vote → SMART goals. [what-is-a-workshop]
- Ignore print specs on the web: CMYK, 300 DPI, bleed, trim and safe area, crop marks, paper stock, folds and QR codes are print-only; digital work uses RGB. [flyer-sizes] [how-to-design-a-flyer] [how-to-make-a-brochure]

## Numbers & thresholds
| Value | Meaning | Source |
|---|---|---|
| 5 | Style guide core elements | what-is-a-style-guide |
| 25–35 pages | Style guide length | what-is-a-style-guide |
| Every 6–12 months | Style guide update cadence | what-is-a-style-guide |
| 12 / 6 | Logo types catalogued | types-of-logos / how-to-design-a-logo |
| 5 | Logo quality principles | how-to-design-a-logo |
| 5 parts | Story arc | presentation-ideas |
| 20 in 3 families | Opening hooks | how-to-start-a-presentation |
| First 60 s; 3 s pause | Memorize the opening; pause after the hook | how-to-start-a-presentation |
| 7×7 | At most 7 lines of at most 7 words | how-to-start-a-presentation |
| 5/5/5 | At most 5 slides, 5 min per slide, 5 words per line | presentation-ideas |
| Helvetica 24 pt | Default slide type (slides only) | presentation-ideas |
| 47% | Presenters who find slide design a challenge | presentation-ideas |
| 3; 16:9 / 9:16 | Storyboard types; hero vs social aspect ratio | storyboarding |
| 5–10 s → 2–5 s | Cinemagraph source clip → final loop | how-to-make-a-cinemagraph |
| 58% | Designers who rank visual design and polish as the most in-demand skill | how-to-make-a-cinemagraph |
| Under 30 s | Time to find a flyer's key details | flyer-examples |
| 1–2 fonts; 1 CTA; 1–2 high-contrast elements | Limits per piece | how-to-design-a-flyer |
| 1 page | Resume length (unless decades of experience) | how-to-design-a-resume |
| 3×3 (1 + 8) | Lotus diagram: the goal plus 8 ideas | what-is-a-workshop |
| 300 DPI; bleed 0.125 in; safe area 0.125–0.25 in; 100–170 gsm | Print-only; never apply to the web | flyer-sizes |

Coverage: 16/16 files read (brand 10, print 6).
