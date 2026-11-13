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

## Agentes e economia de tokens
- Busca/leitura de arquivos e logs: delegue ao `ajudante-haiku`. Fluxos em vários arquivos e revisão de diff: `ajudante-sonnet`. Decisão difícil: `ajudante-opus`. `ajudante-fable` só se o usuário pedir.
- Antes de push/PR e após deploy: rode o agente `testador-site` (`.claude/agents/testador-site.md`) e leia só o resumo dele.
- Leia só os trechos necessários (offset/limit); use Grep/Glob antes de abrir arquivos. Não releia o que já foi lido.
- Comandos: detecte o gerenciador pelo lockfile e use os scripts do `package.json`; se um script não existir, diga e não invente.
- Fonte única das skills de design: repositório `web-design-kit` (`install.mjs`).
