---
name: bibliotecas-de-design
description: Catálogo das bibliotecas de design e animação aprovadas pelo dono (GSAP, Motion, Three.js, Cult UI, Spell UI, Unlumen UI, Skiper UI, Uiverse, Refero Styles, MotionSites) — o que cada uma oferece, licença, como instalar e como adaptar a sites sem Tailwind. Use ao criar, animar ou redesenhar qualquer seção, componente ou efeito.
---

# Bibliotecas de design aprovadas

## Regras (valem para todas)
- A skill `web-design` e o `DESIGN.md` do site mandam: a biblioteca é fonte de ideias e código, não de estilo. Use os tokens do site.
- Site sem Tailwind (ex.: casa-do-quimico, que usa CSS Modules): não instale Tailwind nem shadcn. Leia o código do componente e reescreva em CSS Modules com os tokens do site.
- Dependência nova só quando uma seção de verdade usar. Carregue no cliente com import dinâmico (`next/dynamic`), fora do caminho do LCP, e respeite `prefers-reduced-motion`.
- Confira licença e atribuição antes de copiar. Item pago só com a conta do dono.

## Catálogo
| Biblioteca | Serve para | Licença / custo | Como usar |
|---|---|---|---|
| [GSAP](https://gsap.com) | Timelines, ScrollTrigger, SplitText, morph | Grátis, plugins inclusos | `npm i gsap @gsap/react` (`useGSAP`); skills `hzblj-skills:gsap-*` |
| [Motion](https://motion.dev) | Animação em React/JS (ex-Framer Motion), gestos, layout | MIT | `npm i motion`; `import { motion } from "motion/react"` |
| [Three.js](https://threejs.org) | 3D e WebGL | MIT | `npm i three`; no React, `@react-three/fiber` + `@react-three/drei`, sempre sob demanda |
| [Cult UI](https://cult-ui.com) | Componentes animados (shaders, mockups, inputs de IA) | MIT, grátis | Tailwind: `npx shadcn@latest add @cult-ui/<nome>`; sem Tailwind: copiar e adaptar |
| [Spell UI](https://spell.sh) | Texto revelado, shimmer, marquee, cards com tilt | Conferir no repositório `xxtomm/spell-ui` | Registro shadcn; sem Tailwind: copiar e adaptar |
| [Unlumen UI](https://ui.unlumen.com) | Componentes com Motion, revelação no scroll, contadores | Gratuidade a confirmar (pode exigir conta 21st.dev) | `npx shadcn@latest add @unlumen/ui/<nome>` |
| [Skiper UI](https://skiper-ui.com) | Seções e componentes animados para Next.js | Parte paga; grátis exige atribuição | Copiar e adaptar respeitando a licença |
| [Uiverse](https://uiverse.io) | Botões, loaders, toggles e cards em HTML/CSS puro | MIT | Copiar o CSS para CSS Modules e trocar cores por tokens |
| [Refero Styles](https://styles.refero.design) | DESIGN.md de sites reais (tipografia, cor, espaço) | Conta Refero | MCP oficial: `claude mcp add --transport http refero https://api.refero.design/mcp` com o token do dono |
| [MotionSites](https://motionsites.ai) | Prompts prontos de heróis animados | Pago | Só como inspiração; o prompt vem da conta do dono |

## Ainda sem identificação
Inspora, Getlayers e OriginKit (talvez Origin UI, hoje coss ui): pedir a URL ao dono antes de usar.

## Checagem antes de entregar
- Animação só em `transform` e `opacity`, de 150 a 250 ms na interface, e estado final instantâneo com movimento reduzido.
- Sem regressão de LCP, INP ou CLS (use o agente `auditor-desempenho`).
- Teclado e contraste conferidos (agente `auditor-acessibilidade`).
