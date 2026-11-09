# Continuidade do Projeto2 (para o próximo agente: Antigravity, Claude ou outro)

Leia antes: `CLAUDE.md` (fluxo, deploy, banco) e `README.md` (arquitetura, papéis, endpoints).

## Estado em 09/11/2026

Tudo abaixo está na `main` e publicado (Vercel + Render):

- Login aberto, níveis de acesso (Gerente / Administrador / Funcionário), tela **Equipe**.
- Alertas de prazo (`/alertas`) com preferências por conta.
- Formatação dos modelos (`/documentos/modelos`), com cópia do texto em cada documento emitido.
- Ministério Público e Funcionários ajustados ao protótipo (PDF "Tela de funcionários e MP" + vídeo de 09/11):
  - MP: cards "Documentos cadastrados / Pendentes de revisão / Confirmados ao MP"; filtros com os 10 tipos,
    períodos relativos (este mês … ano passado) e status Pendente, Em revisão, Aprovado, Rejeitado, Enviado, Arquivado;
    menu ⋮ com Baixar, Renomear, Fazer uma cópia, Mover (troca o tipo) e Mover para a lixeira (com Lixeira e Restaurar).
    Registros antigos são convertidos na leitura (`mpSubmissionSchema` em `frontend/src/lib/schemas.ts`).
  - Funcionários: filtro de Função com as funções do protótipo e de Status com a situação no quadro
    (Ativo, Inativo, Afastado, Férias, Licença, Desligado); "reloginho" abre justificativas + histórico de pontos;
    clicar numa justificativa abre Aprovar / Rejeitar / Visualizar e um X para fechar.

Produção: o banco ainda não tinha nenhuma conta em 09/11. **A primeira conta que entrar vira Gerente**;
`APP_MANAGER_EMAILS` (Render) garante Gerente para `gabrielsarges1926@gmail.com` e `hbsv@cesar.school`.

## O que falta (por prioridade)

1. **Alertas por e-mail (Backlog 10, parte de e-mail).** Hoje os alertas só aparecem no painel.
   Falta um job diário no backend (`@Scheduled`) que monte os alertas de cada conta (mesmas regras de
   `frontend/src/lib/alerts.ts` → `buildAlerts`) e envie por e-mail respeitando `preferences.alerts`.
   Precisa de um serviço de e-mail (SMTP ou API) com a chave só no Render, nunca no Git.
   Precisa também de um campo "receber por e-mail" nas preferências da tela `/alertas`.
2. **Ponto com localização (Backlog 7, tela 7.3).** O protótipo pede horário + localização no registro de presença.
   Conferir `EmployeeView` em `frontend/src/app/funcionarios/page.tsx`; se faltar, usar a Geolocation API
   com consentimento e guardar só o necessário (LGPD).
3. **Assinatura digital (Backlog 2, tela 2.3).** Existe só a marca `signed` no documento. Definir com a equipe
   o que é "assinatura" (imagem pré-cadastrada por representante?) antes de implementar.
4. **Seletor de dia no gráfico do Painel** (opcional; hoje o valor por dia aparece no tooltip e na tabela).
5. **Testes da Sprint 4 (Hannah)**: roteiro em cima das telas acima.

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
