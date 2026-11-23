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

## PDFs e planilhas entregues ao usuário
Vale para todo PDF, documento ou planilha que a sessão gerar como entrega. As exportações do próprio sistema seguem o `DESIGN.md`.
- **Estrutura**: título, seções com títulos curtos (tópicos), listas para itens paralelos e tabelas para dados comparáveis. Cada seção começa direto no conteúdo.
- **Visual sóbrio**: texto todo preto numa fonte comum de documento (Calibri ou Carlito). Títulos ficam em negrito e preto. Código vai em fonte monoespaçada, só recuado. Tabelas usam grade preta simples.
- **Texto da equipe**: frases curtas e só o necessário, como se a equipe tivesse escrito. O documento começa no título e termina no último tópico, sem introdução sobre o pedido, sem nota sobre como foi feito e sem rodapé de numeração.
- **Planilhas** saem em `.xlsx`: uma aba por assunto, cabeçalho em negrito e congelado, filtro ligado, colunas na largura do conteúdo, valores em R$ e datas no formato brasileiro.
- **Conferência visual** antes de entregar: gere imagens das páginas e confira que nada sai da margem, que nenhum título fica sozinho no fim da página e que não sobra página quase vazia.
