# Projeto2 — regras para sessões do Claude Code

## Fluxo
- Trabalhe numa branch própria, faça push e abra um PR para a `main`. Só faça o merge quando o usuário pedir.
- Merge na `main` publica: frontend na Vercel e backend no Render (`render.yaml`). Detalhes no `README.md`, seção "Produção".
- `iniciar.bat` / `iniciar.ps1` / `INICIAR_R6_3.*` são só para rodar no Windows local; não fazem parte da publicação.

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
