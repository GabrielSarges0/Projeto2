# Projeto2 (Fundação Manoel Cruz / CESAR School) — Dossiê Completo de Arquitetura e Histórico de PRs (#1 a #4)

Este documento detalha em nível de engenharia toda a evolução do **Projeto2** (Plataforma de Gestão Imobiliária, Patrimonial, Financeira e Operacional da Fundação Manoel Cruz - FMC), cobrindo infraestrutura, banco de dados, commits de fundação e todas as entregas **Pull Request por Pull Request**.

---

## 1. Visão Geral da Arquitetura e Infraestrutura

| Camada | Tecnologia / Serviço | Identificadores e Regras de Operação |
| :--- | :--- | :--- |
| **Repositórios GitHub** | `gpss-sarges/Projeto2` / `GabrielSarges0/Projeto2` | Conta dona para merge em produção: `gpss-sarges` (`github_stour-sass`). |
| **Frontend (Produção)** | Vercel (`https://projetocesarschool.vercel.app`) | Projeto `projeto_dois` (time `gpss-cesarschool`), Root Directory: `frontend`. Next.js App Router, TypeScript, CSS Modules. |
| **Backend API (Produção)** | Render (`https://projeto2-fmc-api.onrender.com`) | Spring Boot 3 + Java 21 + Maven (`./mvnw -B package`), empacotado via `backend/Dockerfile` e orquestrado por `render.yaml`. |
| **Banco de Dados** | Supabase PostgreSQL (`xgqjihgzhpmcpukmjmbv`) | Projeto `Projeto2-FMC`, schema isolado `projeto2`. Em testes locais/CI usa H2 in-memory. |
| **Migrações de Banco** | Flyway (`backend/src/main/resources/db/migration/`) | SQL estritamente compatível com PostgreSQL e H2. Aplicadas automaticamente pelo perfil `prod`. |
| **Design & Protótipo** | Figma (`IvNhLg0cTwcZo15D5YF9vI`) | Alinhado à planilha oficial `Sprints + backlog + Ciclo de Vida` (Google Sheets `gpss@cesar.school`). |

---

## 2. Catálogo de Migrations Flyway (`backend/src/main/resources/db/migration/`)

| Versão | Arquivo SQL | O que estrutura no schema `projeto2` |
| :--- | :--- | :--- |
| **V3** | `V3__financial_transactions.sql` | Tabela central de lançamentos financeiros (Receitas/Entradas, Despesas/Saídas, categorias, valores, datas, status e vínculo com imóveis/comprovantes). |
| **V4** | `V4__reminders_and_properties.sql` | Tabelas de Imóveis da Fundação (`properties` — endereço, inquilino, situação Ocupado/Livre/Manutenção, valor de aluguel) e Lembretes/Alertas (`reminders` — vencimento, prioridade, categoria). |
| **V5** | `V5__initial_seed_data.sql` | Carga inicial de dados reais da Fundação Manoel Cruz (imóveis, contratos, histórico operacional e movimentações financeiras de referência). |

---

## 3. Commits de Fundação e Alinhamento com o Figma (Pré-PRs)

Antes da abertura do PR #1 na nuvem, a base do sistema foi construída nos seguintes marcos:

1. **Estrutura Inicial (`b422d81`):** Criação do monorepo `ProjetoDois - Gestão Fundação Manoel Cruz` separando `backend/` (Spring Boot Java 21) e `frontend/` (Next.js).
2. **Alinhamento Financeiro com o Figma (`3b8b081`):** Construção dos modais de Nova Entrada e Nova Saída, cálculo automático de saldo líquido e cards de KPIs 100% fiéis ao wireframe do Figma.
3. **Backend Java Completo + Integração Frontend (`7429fda`):** Controllers, Services, Repositories JPA e DTOs para imóveis, lembretes, histórico, métricas financeiras e contratos conectados ao frontend via `frontend/src/lib/financial-api.ts`.
4. **Fidelidade Visual Integral ao Figma (`d7f40e4`, `eb39eaa`, `d1d8d87`, `491c834`):**
   - Alinhamento pixel-perfect das telas de **Painel (Dashboard)**, **Financeiro**, **Documentos**, **Imóveis**, **Histórico** e **Sidebar**.
   - Gráfico dinâmico de *Receitas x Despesas*, upload e abertura de documentos e estruturação por pastas.
   - Remoção da aba redundante `"Acesso e Governança"` da Sidebar para simplificar a navegação.

---

## 4. Histórico Detalhado Pull Request por Pull Request

### PR #1 · Publicação Full-Stack na Nuvem (Supabase + Render + Vercel)
- **Commit de Merge:** `d429653` · **Data:** 29/10/2026
- **Motivação:** Tirar o projeto da dependência dos scripts locais de Windows (`iniciar.bat` / `INICIAR_R6_3.bat`) e publicá-lo 100% online com banco persistente.
- **Arquivos Criados / Modificados:**
  - `backend/Dockerfile` e `backend/.dockerignore`: build multi-stage Maven + Eclipse Temurin Java 21 JRE.
  - Correções no `mvnw`, no contexto do build Docker e no cliente da API.
  - `render.yaml`: Blueprint IaC para deploy automático do web service no Render (plano free) lendo variáveis de ambiente seguras.
  - `backend/src/main/resources/application-prod.properties`: Configuração do perfil `prod` apontando para o PostgreSQL do Supabase no formato JDBC (`jdbc:postgresql://...`) com schema `projeto2` e porta dinâmica `$PORT`.
  - `frontend/.env.production`: Apontamento do cliente Next.js na Vercel para `https://projeto2-fmc-api.onrender.com`.
  - `README.md` e [guia de desenvolvimento](docs/DESENVOLVIMENTO.md): Documentação do fluxo de deploy e regras de banco.

---

### PR #2 · Governança de Segurança e Autenticação HTTP Basic / AuthGate
- **Commit de Merge:** `640472d` · **Data:** 29/10/2026
- **Arquivos Principais:**
  - Backend: `SecurityConfig.java`, `AuthController.java`, `AuthSecurityTest.java` (53 linhas de testes MockMvc).
  - Frontend: `frontend/src/app/login/page.tsx`, `login.module.css`, `frontend/src/components/layout/AuthGate.tsx`, `frontend/src/lib/auth.ts`, `frontend/src/lib/financial-api.ts`.
- **Entregas:**
  - **Backend Spring Security:** Autenticação stateless parametrizada por `APP_ADMIN_USER` e `APP_ADMIN_PASSWORD`; retorno `401` limpo (sem header `WWW-Authenticate` que trava popup nativo do navegador); liberação pública de health-check e preflight CORS `OPTIONS`; rota `GET /api/v1/auth/me`.
  - **Frontend:** Tela `/login`, persistência de credenciais na aba (`sessionStorage`) e componente `AuthGate` protegendo as rotas. *(Nota: posteriormente flexibilizado no commit `d8f7904` do PR #4 a pedido do cliente para acesso direto ao painel).*

---

### PR #3 · Ambiente Padronizado no GitHub Codespaces com Dados Reais
- **Commit de Merge:** `3101f4a` · **Data:** 29/10/2026
- **Arquivos Criados / Modificados:** `.devcontainer/devcontainer.json`, `.devcontainer/setup.sh`, `.devcontainer/start.sh`, `WebConfig.java`, `AuthSecurityTest.java`
- **Entregas:**
  - Container de desenvolvimento na nuvem pré-configurado com Java 21 e Node.js 20, instalando dependências automaticamente (`setup.sh`) e subindo backend + frontend em paralelo (`start.sh`) conectados aos dados reais, permitindo desenvolver e testar de qualquer máquina ou navegador.
  - Ajuste de CORS em `WebConfig.java` para aceitar origens `*.app.github.dev` do Codespaces.
  - Atualização do ambiente para Node.js 24, documentação do fluxo e configuração dos segredos de Codespaces.

---

### PR #4 · Sprint 03 Completa do Backlog, Ciclo de Vida e Novos Módulos do Cliente (Clientes, Estoque por Pacote, Presença com Saída e Formulários)
- **Branch:** `feat/sprint-03-funcoes-backlog` · **Merge Commit:** `2ea5b52` (commits `c49f411`, `9f0c97e`, `d8f7904`, `15eb47d`) · **Data:** 02/11/2026
- **Deploy de Produção Vercel:** `dpl_HiYVfoqK4t6Qzvb2ux8CKbKgcbgw` (`READY / PROMOTED` em `https://projetocesarschool.vercel.app`)
- **Motivação:** Implementar todas as 13 tarefas atribuídas ao Gabriel na planilha oficial `Sprints + backlog + Ciclo de Vida` (Google Drive `gpss@cesar.school`) + requisitos extras solicitados pelo cliente a partir do wireframe oficial do Figma (`IvNhLg0cTwcZo15D5YF9vI`).
- **Arquivos Criados / Modificados (+5.900 linhas adicionadas):**
  - `frontend/src/lib/shared-store.ts` (store reativo centralizando imóveis, clientes, estoque, funcionários, documentos e fluxo financeiro).
  - `frontend/src/app/clientes/page.tsx` (724 linhas) e `clientes.module.css` (478 linhas).
  - `frontend/src/app/estoque/page.tsx` (452 linhas) e `estoque.module.css` (281 linhas).
  - `frontend/src/app/funcionarios/page.tsx` (495 linhas) e `funcionarios.module.css` (366 linhas).
  - `frontend/src/app/formulario/page.tsx` (449 linhas) e `formulario.module.css` (283 linhas).
  - `frontend/src/app/perfil/page.tsx` (192 linhas) e `perfil.module.css` (229 linhas).
  - `frontend/src/components/finance/FinancialDashboard.tsx` (614 linhas), `DashboardHome.tsx`, `Topbar.tsx`, `Sidebar.tsx`.
- **Detalhamento das 15 Entregas do PR #4:**
  1. **Nova Área de Clientes (`/clientes` — Requisito BP11):**
     - Atalho adicionado na `Sidebar.tsx` logo abaixo do Painel.
     - Visão consolidada dos **124 imóveis**, inquilinos, fiadores e alertas de contratos próximos do vencimento com botão de **Renovação em 1 clique**.
     - Modal de Ficha Completa do Cliente: quantidade de moradores no imóvel, declaração de bens vinculados à locação, dados completos do fiador com garantias e links diretos para abrir os documentos anexados.
  2. **Módulo de Estoque com Especificação por Embalagem/Pacote (`/estoque` — Requisito BP08):**
     - Layout idêntico ao Figma com seletor de Ano/Mês e card de Gasto Mensal Total.
     - Tabela discriminando explicitamente a **quantidade/volume por embalagem** (ex.: *Detergente 540ml*, *Tinta Acrílica 18L*, *Papel Higiênico fardo 10x*).
     - Modal de Registro de Compra (com lançamento automático de saída no Fluxo de Caixa Financeiro) e Modal de Retirada de Insumo por funcionário responsável.
  3. **Módulo de Funcionários e Presença com Horário de Saída (`/funcionarios` — Requisito BP07):**
     - Seletor de data diária, tabela com Nome, Função, Status de Presença, Horário de Entrada e a nova coluna obrigatória de **Horário de Saída**.
     - Seção dedicada de *Justificativas de Falta / Atestados* com anexo e modais de *"Cadastro de Funcionários"* e *"Registro de Presença"*.
  4. **Emissor de Formulários e Documentos Padronizados (`/formulario` — Requisito BP02):**
     - Gerador interativo para 4 documentos oficiais da Fundação: *Recibo de Quitação de Aluguel*, *Contrato de Locação*, *Termo de Vistoria Predial* e *Prestação de Contas Trimestral*.
     - Pré-visualização em papel timbrado da FMC em tempo real, impressão/PDF nativo e botão para salvar automaticamente na aba Documentos.
  5. **Tela Completa de Perfil do Usuário (`/perfil`):**
     - Acessível pelo menu dropdown do avatar no `Topbar.tsx`, exibindo dados cadastrais, cargo na FMC, matriz de permissões, preferências de alerta e segurança.
  6. **Edição Dinâmica da Situação dos Imóveis (`EditPropertyModal`):**
     - Permite alterar em tempo real o status do imóvel (*"Ocupado"*, *"Livre"*, *"Em Manutenção"*), endereço, inquilino vinculado e valor mensal.
  7. **Visualização e Criação Estruturada de Lembretes:**
     - Clique em qualquer lembrete abre modal de detalhes completos; criação estruturada com título, data de vencimento, categoria, nível de prioridade, valor estimado e observações.
  8. **Gráficos Financeiros 100% Dinâmicos:**
     - O gráfico da tela inicial e do módulo financeiro é calculado dia a dia a partir das transações reais de Entrada e Saída registradas no período selecionado.
  9. **Integração Automática Documentos ⇄ Fluxo de Caixa:**
     - Ao fazer upload de um comprovante ou nota fiscal na aba `/documentos`, o usuário pode marcar a opção de lançar automaticamente a respectiva Entrada ou Saída no Financeiro.
  10. **Registro Manual no Financeiro com Vínculo de Recibos:**
      - Modais de Nova Entrada e Nova Saída permitem anexar ou referenciar comprovantes já existentes no acervo.
  11. **Filtros Dinâmicos Multimodais com Chips:**
      - Filtros combináveis em Imóveis (situação e faixa de valor), Histórico (tipo de evento e responsável) e Documentos (categoria e status de assinatura).
  12. **Modal Seguro de Confirmação de Exclusão:**
      - Substituição do `window.confirm()` nativo por modal visual customizado com aviso de irreversibilidade antes de apagar documentos.
  13. **Datas Cronológicas Reais no Histórico:**
      - Substituição de códigos estáticos (`IM-001`) pelas datas e horários reais de ocorrência.
  14. **Scrollbars Universais (`globals.css`):**
      - Estilização padronizada de barras de rolagem visíveis e responsivas em todas as tabelas e modais.
  15. **Acesso Direto ao Painel sem Fricção de Login (`d8f7904`):**
      - Por solicitação explícita para apresentação e operação ágil do cliente, o `AuthGate` foi configurado para liberar a entrada direta no painel principal (`/`), mantendo o token padrão de integração com a API.
- **Verificação:**
  - Frontend: `npm run build` compilou todas as **15 rotas** sem erros no Turbopack.
  - Backend: `./mvnw test` aprovou **14/14 testes automatizados**.
  - Planilha `Sprints + backlog + Ciclo de Vida`: todas as 13 linhas do Gabriel marcadas como **Concluído**.
