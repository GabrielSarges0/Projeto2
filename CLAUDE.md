# Projeto2 — regras para sessões do Claude Code

## Fluxo
- Trabalhe numa branch própria, faça push e abra um PR para a `main`. Só faça o merge quando o usuário pedir.
- Merge na `main` publica: frontend na Vercel e backend no Render (`render.yaml`). Detalhes no `README.md`, seção "Produção".
- `iniciar.bat` / `iniciar.ps1` / `INICIAR_R6_3.*` são só para rodar no Windows local; não fazem parte da publicação.

## Deploy sem bloqueio
- **Vercel** (plano Hobby, dono `GabrielSarges0`): bloqueia deploy de commit cujo autor no GitHub não é do time (ex.: `gpss-sarges`). Faça o merge com **rebase** (`merge_method=rebase`, mantém a autoria dos commits) ou pelo GitHub logado como `GabrielSarges0`. Se mesmo assim bloquear, o dono clica em *Redeploy* no deploy bloqueado.
- **Render**: o repositório é privado; o deploy só funciona com o GitHub App do Render instalado na conta `GabrielSarges0` com acesso ao `Projeto2`. Sem isso o deploy falha com 404 e o auto-deploy não dispara.
- **Ordem**: quando a API mudar, publique o backend (Render) antes do frontend (Vercel); o frontend novo não funciona com a API antiga.

## Codespaces
- `.devcontainer/` instala Java 21 + Node 24 e as dependências. Os valores vêm dos Codespaces secrets do repositório (Settings → Secrets and variables → Codespaces), nunca de arquivo no Git.
- O backend roda por padrão no perfil `r63` (H2 local). `SPRING_PROFILES_ACTIVE=prod` liga no banco real **e roda as migrations Flyway pendentes nele** — só use com migrations já aprovadas.

## Verificação antes do push
```bash
cd backend && ./mvnw -B package          # compila e roda os testes
cd frontend && npm ci && npm run build
```

## Banco de dados
- Produção: Supabase, projeto `xgqjihgzhpmcpukmjmbv` (Projeto2-FMC), schema `projeto2`. Mudanças de schema só por nova migration Flyway em `backend/src/main/resources/db/migration/` (compatível com PostgreSQL e H2).
- **Qualquer escrita no banco de produção exige confirmação do usuário.**

## Design e front-end
- Todo trabalho de UI segue a skill `web-design` (`.claude/skills/web-design/` no Claude Code, `.agents/skills/web-design/` no Antigravity) e o `DESIGN.md` da raiz.
- Este site precisa ter visual único: antes de qualquer decisão visual, leia o `DESIGN.md` e o `references/signatures.md` da skill.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
