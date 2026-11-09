# Continuidade do Projeto2 (para o próximo agente: Antigravity, Claude ou outro)

Leia antes: `CLAUDE.md` (fluxo, deploy, banco) e `README.md` (arquitetura, papéis, endpoints).

## Estado em 09/11/2026

Tudo abaixo está implementado e validado (backend 31/31 testes verdes, frontend lint e build 18 rotas sem erros):

- Login aberto, níveis de acesso (Gerente / Administrador / Funcionário), tela **Equipe**.
- Alertas de prazo (`/alertas`) com preferências por conta e opção de **receber resumo diário por e-mail**.
- Backend de alertas por e-mail:
  - `AlertDigestService` e `AlertScheduler` (`@Scheduled(cron = "${app.alerts.cron:0 0 8 * * *}")`).
  - Coleta automática de prazos críticos e avisos para contas ativas com notificação por e-mail habilitada.
  - `HttpOrLogAlertEmailSender` (zero dependências extras, suporte a webhook/API do Render com fallback seguro em log).
  - Endpoint `POST /api/v1/alerts/digest/trigger` para disparo manual sob demanda (exclusivo para Editores/Gestores).
  - Teste de integração automatizado: `AlertDigestIntegrationTest`.
- Ponto com localização e LGPD (Backlog 7, tela 7.3):
  - Geolocation API no registro de presença (`EmployeeView`), capturando coordenadas aproximadas (~11m de precisão, 4 casas decimais) com consentimento explícito para conformidade com a LGPD.
  - Campos opcionais `entryLocation`, `breakStartLocation`, `breakEndLocation`, `exitLocation` no `attendanceSchema`.
  - Exibição de tags de localização no "Reloginho" (`HistoryModal`) do gestor, no histórico do funcionário e na tabela diária.
  - Preservação de localização na edição manual pelo gestor.
- Seletor de dia no gráfico do Painel (`DashboardHome`):
  - Dropdown interativo de seleção de dia ("Mês inteiro" vs "Dia X").
  - Card de inspeção com detalhamento de lançamentos de entradas e saídas do dia selecionado.
- Formatação dos modelos (`/documentos/modelos`), com cópia do texto em cada documento emitido.
- Ministério Público e Funcionários ajustados ao protótipo:
  - MP: cards de contadores, filtros dos 10 tipos, períodos relativos, menu ⋮ com ações de arquivo e lixeira.
  - Funcionários: filtros de Função e Status no quadro, reloginho lateral com histórico de pontos e justificativas com aprovação/rejeição.

Produção: o banco ainda não tinha nenhuma conta em 09/11. **A primeira conta que entrar vira Gerente**;
`APP_MANAGER_EMAILS` (Render) garante Gerente para `gabrielsarges1926@gmail.com` e `hbsv@cesar.school`.

## O que falta (por prioridade)

1. **Assinatura digital (Backlog 2, tela 2.3).** Existe a marca `signed` no documento. Definir com a equipe
   o que é "assinatura" (imagem pré-cadastrada por representante?) antes de implementar.
2. **Roteiro de homologação da Sprint 4 (Hannah)**: validação ponta a ponta dos fluxos acima.

## Como verificar antes de abrir PR

```bash
cd backend && ./mvnw -B package
cd frontend && npm ci && npx tsc --noEmit && npm run lint && npm run build
```

Para testar no navegador com dados locais: rode o backend (`java -jar backend/target/*.jar`, perfil `r63`, H2)
e o frontend com `NEXT_PUBLIC_API_URL=http://localhost:8080`. Apague `backend/data` para começar do zero.

## Regras que não podem ser esquecidas

- Branch própria → PR para a `main`. Merge com **rebase** (a Vercel bloqueia commits de quem não é do time).
- Se a API mudar: publique o backend (Render) **antes** do frontend.
- Mudança de banco só por nova migration Flyway; qualquer escrita no banco de produção exige confirmação do usuário.
- Nada de segredos no Git; preferências e dados pessoais não vão para logs nem para fixtures.
