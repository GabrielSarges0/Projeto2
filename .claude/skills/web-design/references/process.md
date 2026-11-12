# Product process: agent rules for prototyping, flows, validation, MVP and tool choice (distilled from 12 Figma "Design basics" articles)

Follow these before and while building a site or app. `[slug]` = source article. `⚠` = conflicts with or is missing from WCAG 2.2 AA, Core Web Vitals (CWV) or current web practice; the note says what to do instead. "Agent mapping" = a translation of design-tool practice into code practice, not a source claim.

## 1. Before any screen: define the problem
- Answer first: the primary purpose; who it is for and what they are trying to get done; what existing solutions miss; how this improves on them; how it fits the org's mission. [how-to-design-an-app]
- Write one problem statement with business and research input, and keep every screen focused on it. [low-fidelity-prototyping]
- Name the design goal as a user need plus the action you want taken (buy a product, sign up for a newsletter). Align all screens to that goal. [what-is-wireframing]
- Find gaps with a competitive analysis or SWOT. Turn informal early user interviews into personas and check decisions against them. Record purpose and core features in a PRD. [how-to-design-an-app]
- Leave out of v1 any feature that doesn't support a user task or the primary goal. [how-to-design-an-app]

## 2. Choose fidelity
- Match fidelity to confidence: start rough and add polish as confidence grows. A hi-fi build made before the flow is clear wastes time and creates attachment. [what-is-rapid-prototyping]
- Use lo-fi to explore several concepts, win quick buy-in and test basic flows and IA. Use hi-fi for realistic usability tests, final approval and developer handoff. [what-is-prototyping]
- Move to hi-fi only after concept testing has validated the direction. [high-fidelity-prototyping]
- Skip lo-fi when an established design system exists and the new design resembles existing patterns; higher fidelity is just as fast then. [what-is-wireframing] Agent mapping: in a repo with tokens and components, prototype directly with the real components.
- Default rapid prototypes to medium fidelity: key interactions plus some design elements. [what-is-rapid-prototyping]
- Make 3–4 lo-fi variations in one sitting and compare them side by side. [what-is-rapid-prototyping]
- Judge the experience apart from the look: grayscale, few fonts, boxes for images. [what-is-rapid-prototyping] [what-is-wireframing]
- If reviewers fixate on visuals or placeholder copy, lower the fidelity. Before reviews, say what is intentionally incomplete. [what-is-wireframing] [what-is-rapid-prototyping]
- Show lo-fi to users and stakeholders for critique, since people criticize rough work more freely. Show hi-fi to customers and investors for buy-in. [low-fidelity-prototyping] [wireframe-vs-mockup]
- Let a hi-fi prototype cover one high-priority feature while the rest stays rough; annotate where to focus. [what-is-prototyping] [low-fidelity-prototyping]

## 3. Wireframes and mockups
- Wireframe structure only: screen layouts, nav bars, UI components, interactive elements, content hierarchy. [what-is-wireframing]
- For each screen, answer: which screens the task needs, what information moves the user forward, how to organize the content. [wireframe-vs-mockup]
- Size frames to target devices: mobile 393×852, tablet 834×1194, desktop 1440×1024. [what-is-wireframing] ⚠ Also check 320 CSS px width and 400% zoom with no horizontal scroll (WCAG 1.4.10 Reflow).
- Replace lorem ipsum with real content once IA is involved or the interface is content-rich; "menu item 1-2-3-4" tells you nothing. [what-is-wireframing]
- Keep similar components identical across screens; small variations leave developers unsure. [what-is-wireframing]
- Make navigation and wayfinding obvious. If users would need a sitemap, fix the nav and IA. [what-is-wireframing]
- Don't get attached: gather the feedback, then move to the next iteration. [what-is-wireframing] [wireframe-vs-mockup]
- Call the wireframe done when it shows the essential screens, the flow through conversion funnels, navigation and organization, the main goal and flow of each screen, key elements, content and interactions per screen, and how components compose into templates. Then re-estimate scope. [what-is-wireframing]
- Judge success by whether users finish moderated tests without instructions. [what-is-wireframing]
- Use the mockup (static hi-fi visuals, no function) to validate visual design before hi-fi prototyping or handoff, and keep it as the consistency reference. Apply familiar UI patterns and reuse elements. [wireframe-vs-mockup]

## 4. User flows and IA
- Build each flow in 5 steps:
  1. User, goal and tech-savviness.
  2. Entry point: a search landing page, a homepage sign-up button, a push notification.
  3. Meaningful steps only: forms, buttons, components that move the user forward.
  4. Decision points, errors included, each with a clear prompt and alternatives.
  5. Endpoint: a confirmation page, a success screen or dashboard, or a return to the prior screen. [user-flow]
- Give each flow one goal. Keep steps and branches few, symbols and labels consistent, and share early. [user-flow]
- Map flows at the idea stage, when adding features, before usability tests (to derive the test scenarios) and for cross-functional alignment. [user-flow]
- Map screens to key paths and design them in flow order, not in isolation. [how-to-design-an-app]
- Pick the right artifact:
  - flowchart: system processes
  - task flow: the most efficient path for one action
  - UI flow: interactions within each screen
  - journey map: all touchpoints plus emotions
  - sitemap: content hierarchy and navigation [user-flow]
- Organize IA with card sorting. Use clear labels, intuitive menus, and search with filters and related suggestions. [how-to-design-an-app]
- Show only the steps needed at each point in the flow. [how-to-design-an-app]
- Check commerce flows for a prominent add-to-cart button and an easily edited cart, and check onboarding and login for friction. [user-flow]

## 5. Validate continuously
- Tell the methods apart:
  - concept testing: is this the right problem?
  - usability testing: can users complete the task?
  - UX validation: do the patterns hold up under real states, transitions and data? [ux-validation]
- Pick an approach: moderated for complex or unfamiliar flows, unmoderated for faster and broader feedback, AI synthetic users for logic gaps before you recruit. [ux-validation] ⚠ Synthetic users don't replace testing with real assistive-technology users.
- Run a heuristic evaluation (Nielsen's 10), stress tests past the happy path (errors, edge cases, unexpected input), an early accessibility audit (screen reader, keyboard, other AT) and a technical review with engineers. [ux-validation]
- Render every component and flow in loading, error, empty and success states. Build a control panel that toggles user states, permissions and personas. [ux-validation] Agent mapping: a dev-only state switcher or one story per state.
- Stress with realistic data: long names and labels, failed images, empty lists, 5→50 list items, 3→15 nav items, 200-item dropdowns, a pasted paragraph in a form field, modals at small viewports. [ux-validation]
- Test localization: longer translated strings, currency formats, regional conventions. [ux-validation]
- Specify the in-between logic (hover, loading sequences, error states, dismissal such as a modal closed mid-form) so engineers don't have to guess. [ux-validation]
- Validate as you go, not at handoff: a fix costs minutes in design and days in development. If a working prototype exists, validate it. [ux-validation]
- Track task completion rate, error frequency, time-on-task, drop-off points, steps to complete and edge-case trigger frequency. Fix the edge cases that trigger consistently first. [ux-validation]
- Document what was tested, what broke and what was decided. [ux-validation]
- Schedule tests before building the prototype. Scope each test to one question, log off-scope feedback for a later cycle, and note what users say, where they hesitate and what surprises them. [what-is-rapid-prototyping]
- Use friction logging: teammates use the product firsthand and log confusion. [how-to-design-an-app]
- Before launch, run usability, accessibility, performance (speed, load time, battery), compatibility (devices, OS versions) and QA tests. Fix, then run them again. [how-to-design-an-app] ⚠ Make "performance" concrete with CWV at p75 (LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1) and "accessibility" concrete with WCAG 2.2 AA.

## 6. Scope the MVP
- Treat an MVP as a real product with ruthless prioritization and intentional scope, not a prototype. [what-is-a-minimum-viable-product]
- Check the 4 traits: cheap to produce, makes the main idea obvious, solves a problem or adds value, adaptable to future builds. [what-is-a-minimum-viable-product]
- Prioritize Useful, then Viable, then Delightful. Spend nothing on delight until usefulness and viability are proven. [what-is-a-minimum-viable-product]
- Run Build–Measure–Learn and repeat:
  - Build: state a hypothesis about a user group and build the minimum that tests it.
  - Measure: read the results with metrics and analytics.
  - Learn: was the problem right, how useful was the product, what unexpected problems appeared? [what-is-a-minimum-viable-product]
- Instrument in-product metrics from day one: is the feature used, how often, and how was it discovered. [what-is-a-minimum-viable-product]
- Rank features with an urgency × impact matrix across current and future versions [what-is-a-minimum-viable-product] or with MoSCoW: must, should, could, won't. [how-to-design-an-app]
- Polish before launch, because small bugs and slow loads erode trust. After launch, track which features are used or ignored, drop-off points and review flags, and ship regular updates. [how-to-design-an-app]

## 7. App design sequence
- Work in order: Define → Design (features, wireframes, color, type) → Prototype → Develop (MVP, early feedback) → Test, launch, iterate. [how-to-design-an-app]
- Choose the app type:
  - native: best performance, costliest, one build per OS
  - cross-platform: one codebase
  - hybrid: web tech packaged as native; easier upkeep, fewer features
  - PWA: runs in the browser, simple to deploy, reachable from any device, not always the full native feature set [how-to-design-an-app]
- Keep typography readable at every screen size, and use the palette to guide interactions and build hierarchy. [how-to-design-an-app] ⚠ Never signal state by color alone (WCAG 1.4.1). Text needs 4.5:1; UI components and focus indicators need 3:1 (1.4.3, 1.4.11).
- Add micro-interactions for instant feedback, such as a hover color change or an animated "like". [how-to-design-an-app] ⚠ Touch and keyboard users never hover, so mirror hover feedback on `:focus-visible` and `:active`. Gate non-essential motion behind `prefers-reduced-motion`.

## 8. Tool choice: no-code, low-code, AI codegen
- Decide in 3 steps; combining both approaches is normal. [no-code-vs-low-code]
  1. Complexity and scale: a small internal tool, quick prototype or one-off landing page suits no-code. Scale across teams, custom data or sensitive workflows needs low-code.
  2. Integrations: common services (Sheets, basic CRMs) suit no-code. Custom APIs or proprietary systems need low-code.
  3. Builder: non-technical people suit no-code; engineers suit low-code.
- Expect no-code to launch in minutes to days but stay limited to prebuilt components and low-traffic use. No-code apps that grow or touch sensitive data are a governance risk. [no-code-vs-low-code] ⚠ The sources never assess no-code output against WCAG or CWV. Audit the generated markup and page weight before shipping.
- Expect low-code to take days to weeks, with version control, access permissions and audit trails. Every bit of custom logic adds testing and deployment steps. [no-code-vs-low-code]
- Diagram flows, data structures and logic before building. [no-code-vs-low-code]
- Treat AI-generated code as not production-ready until it passes QA, and resist shipping early. [what-is-rapid-prototyping] No tool produces error-free code without engineer review. [vibe-coding-tools]
- Vet AI coding tools on 5 criteria. [vibe-coding-tools] Agent mapping: hold your own output to the same bar.
  - Reliability: follows directions, the code works, no hallucinated codebases or APIs, no syntax errors, no decline over long sessions.
  - Privacy: zero data retention, inputs not used for training.
  - Quality of completions and suggestions.
  - Test generation for functionality, accessibility and security.
  - Documentation: READMEs and comments.
- Tool fit as the source describes it: [vibe-coding-tools]
  - v0: React-only UI with weak backend support, tied to Next.js and Vercel; its Figma imports are recreated, not accurate to the design system.
  - Cursor or Claude Code: work inside existing codebases; large refactors.
  - Lovable (non-technical founders) or Bolt (browser, no setup): fast prompt-to-app MVPs.

## 9. Handoff
- Give developers exact measurements, token values and CSS properties. Map each design component to its code component so the implementation reuses it. [ux-validation]
- Make the hi-fi prototype the developers' feature reference. [high-fidelity-prototyping]

## Numbers & thresholds
| Value | Meaning | Source |
|---|---|---|
| 393×852 / 834×1194 / 1440×1024 px | Wireframe frames: mobile / 11" tablet / desktop | what-is-wireframing |
| Hours to 1–2 days | Time to build a lo-fi prototype | what-is-prototyping |
| Days to weeks | Time to build a hi-fi prototype | what-is-prototyping |
| Hours to a few days vs days to weeks | Rapid vs "regular" prototype timeline | what-is-rapid-prototyping |
| 3–4 | Lo-fi variations per sitting | what-is-rapid-prototyping |
| 1–2 weeks | Agile sprint cycle that suits rapid prototyping | what-is-rapid-prototyping |
| 5 min vs 30 min | Prototype walkthrough can settle what a slide deck can't | what-is-rapid-prototyping |
| 3→15 nav items; 5→50 list items; 200-item dropdown | Data stress cases | ux-validation |
| 4 | UI states to cover: loading, error, empty, success | ux-validation |
| 10 | Nielsen heuristics for evaluation | ux-validation |
| 6 | Validation metrics to track | ux-validation |
| Minutes vs days | Cost of a logic fix in design vs in development | ux-validation |
| 5 / 4 / 4 | User-flow steps / MVP traits / MoSCoW buckets | user-flow, what-is-a-minimum-viable-product, how-to-design-an-app |
| Minutes to days vs days to weeks | No-code vs low-code time to launch | no-code-vs-low-code |
| 68% (82% satisfied) | Developers who use prompts to generate code | how-to-design-an-app, vibe-coding-tools |
| Up to 1M tokens | Gemini Code Assist context window | vibe-coding-tools |
| Not specified | Test participant counts (no source gives any) | — |

Coverage: 12/12 files read.
