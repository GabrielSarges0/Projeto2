# Signature registry

Every site must look unique (user decision, 2026-11-12). Read this registry before choosing a project's look. Rules are in SKILL.md → Uniqueness: share at most 2 of the 10 axes with any APPROVED signature below, never axis 1, 2 or 4, and use a technique as the primary signature in no more than 2 projects.

## How to update
1. When a project's new signature is approved, fill the 10 axes in that repo's `DESIGN.md`.
2. Add its row to "Approved signatures" in the kit source (`skills/web-design/references/signatures.md`) and delete its row from "Current looks".
3. Re-run `node install.mjs` (and `--project` for each repo that carries the skill) so every project sees the new row.

Axes: 1 Concept · 2 Display face · 3 Text face · 4 Dominant hue family + neutral temperature · 5 Lead theme · 6 Layout archetype · 7 Technique(s) · 8 Shape language · 9 Motion personality · 10 Imagery & texture.

## Approved signatures
| Project | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Approved |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (none yet) | | | | | | | | | | | |

## Current looks (automated snapshot 2026-11-12, to be replaced)
These are the looks being migrated away from. They do not constrain new signatures, but don't recreate them unless the user asks to keep one.

| Project | Fonts | Palette (dominant / accent) | Lead theme | Motion/3D libs | Notes |
|---|---|---|---|---|---|
| Casa do Químico | Archivo + system UI stack | slate ink #0f172a, blue #2563eb, orange brand #e7893b, green #059669 | light | none | E-commerce plus affiliate dashboard |
| Elysion Spa | Cinzel + Montserrat | deep teal #06201d, gold #d9b86c, cream ink #f3ead6 | dark | none | Static/WordPress theme build |
| Projeto2 (FMC) | Inter + Julius Sans One + Jockey One | navy #092a54, gold #c3a95e | light | none | Internal app (Next.js + Java) |
| Arumã | Bricolage Grotesque + Geist (CSS also Inter, Georgia) | sage light #f8faf8; dark variants #090909 with purple #a970ff | light + dark themes | none | Many theme revisions (r109/r110) |
| Missão Salvar Foton | Arial | night navy #07111f, cyan #67e8f9 | dark | none | Browser game |
| Margens | Geist (create-next-app default) | no tokens | light | none | Dashboard |
| Voltech | Orbitron + Poppins | Tailwind defaults | dark (Tailwind) | none | Static HTML |
