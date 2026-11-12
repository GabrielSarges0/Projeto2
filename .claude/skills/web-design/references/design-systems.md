# Design systems: structure and references

Source: Figma, "12 design system examples to help you build your own", plus our integration rules. Token-architecture and enterprise details from the Figma Design basics library are in `ui-ux.md`.

## Anatomy (build every system with all four)
| Layer | Contents | Rule |
|---|---|---|
| Tokens | color, spacing, typography, radius, elevation, motion | Three tiers: primitive (raw values) → semantic (`surface`, `text-muted`, `border-strong`) → component (`button-bg`). Themes remap only the semantic tier. |
| Components (UI kit) | Reusable building blocks | Primitives first (Button, Input, Dialog), then compositions. Every interactive part has hover, focus-visible, active, disabled and loading states. |
| Patterns | Behaviour of nav, modal, forms, empty/loading/error states | Follow WAI-ARIA APG; document behaviour, not just looks. |
| Documentation | When/how to use each element | Each component gets "use / don't use". Content and voice guidelines (error messages, tone) are part of the system. |

## Structure vs expression
- Structure (tiers, primitives, states, a11y, docs) comes from mature systems and stays standard.
- Expression (font, palette, motion, background) lives in token VALUES; that is where distinctiveness goes (see `aesthetics.md`).
- Neutral community kits ("adapts to any brand") are the generic look when used as-is: copy their organisation, replace their token values.
- An existing repo system always wins; propose token changes, don't fork the system.

## Which reference to consult
| Context | Reference | Why |
|---|---|---|
| Android or adaptive web | Material Design 3 — m3.material.io | Dynamic color; shape and motion tokens |
| Native iOS/macOS | Apple Human Interface Guidelines | Platform behaviour and conventions |
| Enterprise, data-dense, a11y-critical | IBM Carbon — carbondesignsystem.com | Strict accessibility, layered token model |
| Admin panels, commerce | Shopify Polaris — polaris-react.shopify.com | Admin components and content guidelines |
| Many interconnected products | Atlassian — atlassian.design; Uber Base | Shared foundation under distinct product identities |
| Configurable theming | Arco Design (ByteDance) | Theme generation from tokens |
| Figma starting point | Community kits (TapTap, Finesse UI, Simple Design System, Dialect, Wanted) | Use the structure, never the neutral skin |

## Figma ↔ code
- Before implementing from Figma, read the file's variables and map them to existing tokens; never paste raw values.
- When components exist on both sides, maintain Code Connect mappings: agents then reuse real components instead of re-creating them (Figma reports Coinbase saw higher adherence and ~22.5% fewer agent tokens; not independently verified).
