# Graph Report - projeto2  (2026-11-14)

## Corpus Check
- 174 files · ~114,915 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 7, .properties 4, .css 3)

## Summary
- 1645 nodes · 4336 edges · 93 communities (65 shown, 28 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc072681`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppShell
- AppRecord
- financial-api.ts
- QrCode
- errorMessage
- Reminder
- AppUser
- package.json
- templates.ts
- clientes/page.tsx
- estoque/page.tsx
- org.springframework.http.ResponseEntity
- ministerio-publico/page.tsx
- schemas.ts
- NewDocumentModal.tsx
- TransactionModals.tsx
- list
- FinancialTransaction
- funcionarios/page.tsx
- ApiFlowsIntegrationTest.java
- SecurityConfig.java
- Property
- RecordCollection
- BearerTokenAuthenticationFilter.java
- SessionTokenService
- org.springframework.transaction.annotation.Transactional
- org.junit.jupiter.api.Test
- UI/UX design principles: agent rules (distilled from 40 Figma "Design basics" articles)
- HttpOrLogAlertEmailSender.java
- UI/UX design principles: agent rules (distilled from 40 Figma "Design basics" articles)
- signatures.ts
- compilerOptions
- Web design: distilled rules for coding agents
- Web design: distilled rules for coding agents
- services
- Typography: agent rules (distilled from 16 Figma "Design basics" articles)
- UserService
- Typography: agent rules (distilled from 16 Figma "Design basics" articles)
- AuthForm.tsx
- useCan
- AuthController
- next
- Color: agent rules (distilled from 16 Figma "Design basics" articles)
- BrazilianDocumentValidator
- Color: agent rules (distilled from 16 Figma "Design basics" articles)
- records.ts
- Product process: agent rules for prototyping, flows, validation, MVP and tool choice (distilled from 12 Figma "Design basics" articles)
- session.ts
- Product process: agent rules for prototyping, flows, validation, MVP and tool choice (distilled from 12 Figma "Design basics" articles)
- Fundação Manuel Cruz - Sistema de Gestão Financeira e Patrimonial (Projeto 2)
- Rules
- UserRolesIntegrationTest
- Rules
- Projeto2 (Fundação Manoel Cruz / CESAR School) — Dossiê Completo de Arquitetura e Histórico de PRs (#1 a #4)
- Creative development: 3D, motion, premium aesthetics
- AlertDigestService
- V4__reminders_and_properties.sql
- WebConfig.java
- Creative development: 3D, motion, premium aesthetics
- notifyFinanceChanged
- Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles)
- Web design
- Projeto2 — regras para sessões do Claude Code
- Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles)
- Web design
- LoginRateLimiter
- perfil/page.tsx
- Design systems: structure and references
- Projeto2BackendApplication.java
- Design systems: structure and references
- V3__financial_transactions.sql
- MCP servers for website work
- V10__app_user.sql
- MCP servers for website work
- DESIGN.md — Projeto2 (FMC)
- frontend/README.md
- Instruções para agentes (Antigravity, Claude Code e outros)
- .agents/skills/web-design/references/signatures.md
- .claude/skills/web-design/references/signatures.md
- setup.sh
- start.sh
- frontend/AGENTS.md
- postcss.config.mjs
- br.org.fundacaomanuelcruz:projeto2-backend
- V8__app_record.sql

## God Nodes (most connected - your core abstractions)
1. `errorMessage()` - 91 edges
2. `Modal()` - 44 edges
3. `formatDate()` - 44 edges
4. `Field()` - 42 edges
5. `todayIso()` - 40 edges
6. `AppUser` - 36 edges
7. `react` - 36 edges
8. `createDocument()` - 31 edges
9. `useCan()` - 31 edges
10. `UserService` - 29 edges

## Surprising Connections (you probably didn't know these)
- `PR #2 · Governança de Segurança e Autenticação HTTP Basic / AuthGate` --references--> `AuthGate()`  [INFERRED]
  HISTORICO_PRs.md → frontend/src/components/layout/AuthGate.tsx
- `Estado em 09/11/2026` --references--> `AlertDigestIntegrationTest`  [INFERRED]
  docs/CONTINUIDADE.md → backend/src/test/java/br/org/fundacaomanuelcruz/projeto2/alert/AlertDigestIntegrationTest.java
- `Estado em 09/11/2026` --references--> `layoutToHtml()`  [INFERRED]
  docs/CONTINUIDADE.md → frontend/src/lib/templates.ts
- `Estado em 09/11/2026` --references--> `AuthForm()`  [INFERRED]
  docs/CONTINUIDADE.md → frontend/src/components/auth/AuthForm.tsx
- `DisplayStatus` --calls--> `daysUntil()`  [EXTRACTED]
  frontend/src/app/clientes/page.tsx → frontend/src/lib/format.ts

## Import Cycles
- None detected.

## Communities (93 total, 28 thin omitted)

### Community 0 - "AppShell"
Cohesion: 0.22
Nodes (12): AlertasPage(), AppShell(), items, Sidebar(), handleLogout(), Topbar(), handleLogout(), resetAlertsCache() (+4 more)

### Community 1 - "AppRecord"
Cohesion: 0.15
Nodes (5): AppRecord, AppRecordId, AppRecordRepository, RecordResponse, RecordService

### Community 2 - "financial-api.ts"
Cohesion: 0.06
Nodes (48): FormErrors, nextCode(), PRICE_RANGES, STATUS_BADGE, HomePage(), ChartPoint, cumulativeByDay(), DashboardHome() (+40 more)

### Community 3 - "QrCode"
Cohesion: 0.08
Nodes (13): appendBits(), assert(), bit, byte, Ecc, getBit(), int, Mode (+5 more)

### Community 4 - "errorMessage"
Cohesion: 0.12
Nodes (50): attachDocument(), confirmRenew(), EditDocumentModal(), handleSubmit(), FolderFormModal(), handleSubmit(), ScanModal(), handleSubmit() (+42 more)

### Community 5 - "Reminder"
Cohesion: 0.09
Nodes (17): CreateReminderRequest, Reminder, ReminderDetails, ReminderCategory, CONTRATO, FINANCEIRO, IMOVEL, OPERACIONAL (+9 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (44): eslintConfig, dependencies, clsx@^2.1.1, date-fns@^4.4.0, @hookform/resolvers@^5.9.1, lucide-react@^1.48.0, next@16.3.6, react@19.2.8 (+36 more)

### Community 8 - "templates.ts"
Cohesion: 0.08
Nodes (42): ALIGN_LABEL, FONT_LABEL, ModelosPage(), select(), normalize(), sameLayout(), sectionTitle, setModelInUrl() (+34 more)

### Community 9 - "clientes/page.tsx"
Cohesion: 0.09
Nodes (28): PreferencesForm(), handleSubmit(), FieldProps, ToastState, ALERT_KIND_LABEL, ALERT_KINDS, AlertItem, AlertKind (+20 more)

### Community 10 - "estoque/page.tsx"
Cohesion: 0.11
Nodes (43): ClientDetails(), ClientesPage(), displayStatus(), EstoquePage(), InventoryHistory(), SaveItem, SaveMovement, FinanceiroPage() (+35 more)

### Community 11 - "org.springframework.http.ResponseEntity"
Cohesion: 0.08
Nodes (11): AlertController, ApiErrorResponse, ApiExceptionHandler, FinancialController, FinancialMovementResponse, RecordController, ForbiddenException, ActiveRequest (+3 more)

### Community 12 - "ministerio-publico/page.tsx"
Cohesion: 0.11
Nodes (35): DocumentosPage(), confirmDeleteDoc(), download(), DocumentRow(), NewDocState, PROTECTED_FOLDERS, EMPTY_FILTERS, Filters (+27 more)

### Community 13 - "schemas.ts"
Cohesion: 0.10
Nodes (19): clientDocumentSchema, CONTRACT_STATUSES, documentSignatureSchema, employeeObject, employeeSchema, INVENTORY_CATEGORIES, INVENTORY_MOVEMENT_LABEL, INVENTORY_MOVEMENT_TYPES (+11 more)

### Community 14 - "NewDocumentModal.tsx"
Cohesion: 0.11
Nodes (27): handleImageUpload(), handleSign(), Props, choiceStyle, Props, Step, SignDocumentModal(), handleImageUpload() (+19 more)

### Community 15 - "TransactionModals.tsx"
Cohesion: 0.13
Nodes (43): addMonthsIso(), ClientFormModal(), handleSubmit(), selectProperty(), validate(), DisplayStatus, FormState, STATUS_BADGE (+35 more)

### Community 16 - "list"
Cohesion: 0.25
Nodes (4): FinancialTransactionRepository, LeaseContractRepository, PropertyRepository, ReminderRepository

### Community 17 - "FinancialTransaction"
Cohesion: 0.11
Nodes (8): BrazilianDocumentType, CNPJ, CPF, FinancialSummaryResponse, FinancialTransaction, FinancialTransactionType, EXPENSE, INCOME

### Community 18 - "funcionarios/page.tsx"
Cohesion: 0.12
Nodes (25): captureLocation(), EmployeesStore, EmployeeView(), punch(), expectedMinutes(), formatMinutes(), HistoryModal(), journeyLabel() (+17 more)

### Community 21 - "Property"
Cohesion: 0.05
Nodes (13): LeaseContract, LeaseContractResponse, Property, PropertyDetails, PropertyController, PropertyMetricsResponse, PropertyRequest, PropertyResponse (+5 more)

### Community 22 - "RecordCollection"
Cohesion: 0.10
Nodes (13): NotFoundException, RecordCollection, ATTENDANCE, CLIENTS, DOCUMENT_FILES, DOCUMENTS, EMPLOYEES, FOLDERS (+5 more)

### Community 24 - "SessionTokenService"
Cohesion: 0.09
Nodes (7): IssuedToken, SessionTokenService, SessionUser, CreateExpenseRequest, CreateIncomeRequest, FinancialService, FinancialServiceTest

### Community 26 - "org.junit.jupiter.api.Test"
Cohesion: 0.21
Nodes (3): ApiFlowsIntegrationTest, AuthSecurityTest, Projeto2BackendApplicationTests

### Community 27 - "UI/UX design principles: agent rules (distilled from 40 Figma "Design basics" articles)"
Cohesion: 0.11
Nodes (18): 10. Design tokens and architecture, 11. Design systems, 12. Design-to-code handoff, 13. Aesthetics and skeuomorphism, 14. Ethics and data, 15. Research, validation, metrics, 1. Visual hierarchy and emphasis, 2. Grouping and layout (Gestalt) (+10 more)

### Community 29 - "UI/UX design principles: agent rules (distilled from 40 Figma "Design basics" articles)"
Cohesion: 0.11
Nodes (18): 10. Design tokens and architecture, 11. Design systems, 12. Design-to-code handoff, 13. Aesthetics and skeuomorphism, 14. Ethics and data, 15. Research, validation, metrics, 1. Visual hierarchy and emphasis, 2. Grouping and layout (Gestalt) (+10 more)

### Community 30 - "signatures.ts"
Cohesion: 0.19
Nodes (17): Props, SignatureBlock(), Props, SignatureVerifyModal(), Props, ModalProps, formatDateTime(), SignatureType (+9 more)

### Community 31 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "Web design: distilled rules for coding agents"
Cohesion: 0.11
Nodes (17): 10. Site-type patterns, 11. Color, 12. Redesign, 13. Build, performance, SEO, accessibility, 14. Trends: durable or fad, 15. Vibe coding, AI site building, MCP, 1. Site structure & IA, 2. Layout & grid (+9 more)

### Community 34 - "Web design: distilled rules for coding agents"
Cohesion: 0.11
Nodes (17): 10. Site-type patterns, 11. Color, 12. Redesign, 13. Build, performance, SEO, accessibility, 14. Trends: durable or fad, 15. Vibe coding, AI site building, MCP, 1. Site structure & IA, 2. Layout & grid (+9 more)

### Community 35 - "services"
Cohesion: 0.11
Nodes (17): paths, generateValue, key, sync, value, services, autoDeploy, buildFilter (+9 more)

### Community 36 - "Typography: agent rules (distilled from 16 Figma "Design basics" articles)"
Cohesion: 0.12
Nodes (16): 1. Anatomy that drives choices, 2. Screen defaults, 3. Kerning, tracking, leading, 4. Alignment, case, rag, 5. Hierarchy, 6. Selecting a typeface, 7. Pairing, 8. Font catalog (+8 more)

### Community 37 - "UserService"
Cohesion: 0.15
Nodes (8): AuthenticatedUser, AppUserRepository, UserRole, ADMINISTRADOR, FUNCIONARIO, GERENTE, CachedUser, UserService

### Community 38 - "Typography: agent rules (distilled from 16 Figma "Design basics" articles)"
Cohesion: 0.12
Nodes (16): 1. Anatomy that drives choices, 2. Screen defaults, 3. Kerning, tracking, leading, 4. Alignment, case, rag, 5. Hierarchy, 6. Selecting a typeface, 7. Pairing, 8. Font catalog (+8 more)

### Community 39 - "AuthForm.tsx"
Cohesion: 0.15
Nodes (12): Como verificar antes de abrir PR, Continuidade do Projeto2 (para o próximo agente: Antigravity, Claude ou outro), Estado em 09/11/2026, O que falta (por prioridade), Regras que não podem ser esquecidas, CadastroPage(), LoginPage(), AuthForm() (+4 more)

### Community 40 - "useCan"
Cohesion: 0.17
Nodes (16): EquipePage(), changeRole(), replace(), ROLE_HELP, FuncionariosPage(), TeamMember, USER_ROLE_LABEL, USER_ROLES (+8 more)

### Community 41 - "AuthController"
Cohesion: 0.30
Nodes (5): AuthController, CurrentUserResponse, LoginRequest, LoginResponse, UpdateProfileRequest

### Community 42 - "next"
Cohesion: 0.19
Nodes (8): nextConfig, metadata, RootLayout(), AuthGate(), nextPath(), PUBLIC_PATHS, authApi, next

### Community 43 - "Color: agent rules (distilled from 16 Figma "Design basics" articles)"
Cohesion: 0.14
Nodes (13): 10. Color grading → UI imagery and hero media, 11. Named shades with hex, 1. Color models and output, 2. Wheel and complements: RYB vs RGB, 3. Hue, value, saturation, temperature, 4. Building scales: tints, shades, tones, 5. Harmony types in UI, 6. Distribution (+5 more)

### Community 45 - "Color: agent rules (distilled from 16 Figma "Design basics" articles)"
Cohesion: 0.14
Nodes (13): 10. Color grading → UI imagery and hero media, 11. Named shades with hex, 1. Color models and output, 2. Wheel and complements: RYB vs RGB, 3. Hue, value, saturation, temperature, 4. Building scales: tints, shades, tones, 5. Harmony types in UI, 6. Distribution (+5 more)

### Community 46 - "records.ts"
Cohesion: 0.13
Nodes (20): API_URL, ApiError, apiErrorBodySchema, apiRequest(), apiRequestVoid(), NetworkError, RequestOptions, send() (+12 more)

### Community 47 - "Product process: agent rules for prototyping, flows, validation, MVP and tool choice (distilled from 12 Figma "Design basics" articles)"
Cohesion: 0.17
Nodes (11): 1. Before any screen: define the problem, 2. Choose fidelity, 3. Wireframes and mockups, 4. User flows and IA, 5. Validate continuously, 6. Scope the MVP, 7. App design sequence, 8. Tool choice: no-code, low-code, AI codegen (+3 more)

### Community 48 - "session.ts"
Cohesion: 0.24
Nodes (9): zod@^4.6.5, getAuthToken(), getSession(), readRaw(), Session, sessionSchema, SessionUser, subscribe() (+1 more)

### Community 49 - "Product process: agent rules for prototyping, flows, validation, MVP and tool choice (distilled from 12 Figma "Design basics" articles)"
Cohesion: 0.17
Nodes (11): 1. Before any screen: define the problem, 2. Choose fidelity, 3. Wireframes and mockups, 4. User flows and IA, 5. Validate continuously, 6. Scope the MVP, 7. App design sequence, 8. Tool choice: no-code, low-code, AI codegen (+3 more)

### Community 50 - "Fundação Manuel Cruz - Sistema de Gestão Financeira e Patrimonial (Projeto 2)"
Cohesion: 0.17
Nodes (11): 🌐 Acesso Online (Vercel), 🏛️ Arquitetura, 🚀 Como Executar Localmente, 💻 Editar de qualquer computador (GitHub Codespaces), 📡 Endpoints da API REST, 📁 Estrutura de Pastas, Fundação Manuel Cruz - Sistema de Gestão Financeira e Patrimonial (Projeto 2), Opção 1: Inicialização em 1 Clique (Recomendado) (+3 more)

### Community 51 - "Rules"
Cohesion: 0.18
Nodes (10): Aesthetics: escaping the generic "AI look", Avoid, Backgrounds, Color & theme, Conflict resolutions (these win over the rules above), Motion, Reference prompt (Anthropic, ~400 tokens), Rules (+2 more)

### Community 53 - "Rules"
Cohesion: 0.18
Nodes (10): Aesthetics: escaping the generic "AI look", Avoid, Backgrounds, Color & theme, Conflict resolutions (these win over the rules above), Motion, Reference prompt (Anthropic, ~400 tokens), Rules (+2 more)

### Community 54 - "Projeto2 (Fundação Manoel Cruz / CESAR School) — Dossiê Completo de Arquitetura e Histórico de PRs (#1 a #4)"
Cohesion: 0.18
Nodes (10): 1. Visão Geral da Arquitetura e Infraestrutura, 2. Catálogo de Migrations Flyway (`backend/src/main/resources/db/migration/`), 3. Commits de Fundação e Alinhamento com o Figma (Pré-PRs), 4. Histórico Detalhado Pull Request por Pull Request, 4. Mapeamento de Sessões (Claude Code & Antigravity) e Sessões Cruzadas, PR #1 · Publicação Full-Stack na Nuvem (Supabase + Render + Vercel), PR #2 · Governança de Segurança e Autenticação HTTP Basic / AuthGate, PR #3 · Ambiente Padronizado no GitHub Codespaces com Dados Reais (+2 more)

### Community 55 - "Creative development: 3D, motion, premium aesthetics"
Cohesion: 0.20
Nodes (9): 3D / WebGL performance, Art direction, Contrast with glass and gradients, Creative development: 3D, motion, premium aesthetics, Micro-interactions, Motion physics, Smooth scroll (Lenis) and accessibility, Stack (+1 more)

### Community 57 - "AlertDigestService"
Cohesion: 0.29
Nodes (3): AlertDigestService, UserAlertItem, AlertEmailSender

### Community 58 - "V4__reminders_and_properties.sql"
Cohesion: 0.31
Nodes (7): idx_lease_contract_end_date, idx_property_status, idx_reminder_done, lease_contract, property, reminder, idx_reminder_done_due_date

### Community 60 - "Creative development: 3D, motion, premium aesthetics"
Cohesion: 0.20
Nodes (9): 3D / WebGL performance, Art direction, Contrast with glass and gradients, Creative development: 3D, motion, premium aesthetics, Micro-interactions, Motion physics, Smooth scroll (Lenis) and accessibility, Stack (+1 more)

### Community 61 - "notifyFinanceChanged"
Cohesion: 0.39
Nodes (9): discardChanges(), attachFile(), RemindersPanel(), confirmDelete(), replace(), saved(), toggle(), notifyFinanceChanged() (+1 more)

### Community 62 - "Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles)"
Cohesion: 0.22
Nodes (8): 1. Style guide → tokens and docs, 2. Logos on the web, 3. Storytelling: landing and About pages, 4. Narrative: hero → proof → CTA, 5. Storyboarding flows and motion, 6. Transferable from print & media, Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles), Numbers & thresholds

### Community 63 - "Web design"
Cohesion: 0.22
Nodes (8): Enhancing an existing site, Non-negotiables, Precedence (higher wins), Reference index (load on demand), Scope decision (user, 2026-11-12): evolve, don't replace, Uniqueness (user decision, 2026-11-12): every site must look unique, Web design, Workflow

### Community 64 - "Projeto2 — regras para sessões do Claude Code"
Cohesion: 0.22
Nodes (8): Banco de dados, Codespaces, Deploy sem bloqueio, Design e front-end, Fluxo, graphify, Projeto2 — regras para sessões do Claude Code, Verificação antes do push

### Community 65 - "Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles)"
Cohesion: 0.22
Nodes (8): 1. Style guide → tokens and docs, 2. Logos on the web, 3. Storytelling: landing and About pages, 4. Narrative: hero → proof → CTA, 5. Storyboarding flows and motion, 6. Transferable from print & media, Brand & storytelling: agent rules for websites (distilled from 10 brand/media + 6 print Figma "Design basics" articles), Numbers & thresholds

### Community 66 - "Web design"
Cohesion: 0.22
Nodes (8): Enhancing an existing site, Non-negotiables, Precedence (higher wins), Reference index (load on demand), Scope decision (user, 2026-11-12): evolve, don't replace, Uniqueness (user decision, 2026-11-12): every site must look unique, Web design, Workflow

### Community 67 - "LoginRateLimiter"
Cohesion: 0.32
Nodes (3): LoginRateLimiter, TooManyRequestsException, Window

### Community 68 - "perfil/page.tsx"
Cohesion: 0.14
Nodes (15): PerfilPage(), handleLogout(), handleSaveSignature(), handleSubmit(), Point, Props, SignatureCanvas(), getCoords() (+7 more)

### Community 69 - "Design systems: structure and references"
Cohesion: 0.33
Nodes (5): Anatomy (build every system with all four), Design systems: structure and references, Figma ↔ code, Structure vs expression, Which reference to consult

### Community 71 - "Design systems: structure and references"
Cohesion: 0.33
Nodes (5): Anatomy (build every system with all four), Design systems: structure and references, Figma ↔ code, Structure vs expression, Which reference to consult

### Community 72 - "V3__financial_transactions.sql"
Cohesion: 0.83
Nodes (3): financial_transaction, idx_financial_transaction_date, idx_financial_transaction_type_date

### Community 73 - "MCP servers for website work"
Cohesion: 0.50
Nodes (3): How to register a server, MCP servers for website work, Shortlist by job

### Community 75 - "MCP servers for website work"
Cohesion: 0.50
Nodes (3): How to register a server, MCP servers for website work, Shortlist by job

### Community 76 - "DESIGN.md — Projeto2 (FMC)"
Cohesion: 0.50
Nodes (3): DESIGN.md — Projeto2 (FMC), Peça tecnológica de destaque, Visual atual (mantido)

### Community 77 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **31 isolated node(s):** `br.org.fundacaomanuelcruz:projeto2-backend`, `CPF`, `CNPJ`, `INCOME`, `EXPENSE` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 596 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Estado em 09/11/2026` connect `AuthForm.tsx` to `ApiFlowsIntegrationTest.java`, `ministerio-publico/page.tsx`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **What connects `br.org.fundacaomanuelcruz:projeto2-backend`, `CPF`, `CNPJ` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppRecord` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Why does `AlertDigestIntegrationTest` connect `ApiFlowsIntegrationTest.java` to `AuthForm.tsx`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Should `financial-api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05870020964360587 - nodes in this community are weakly interconnected._
- **Why does `layoutToHtml()` connect `ministerio-publico/page.tsx` to `templates.ts`, `signatures.ts`, `NewDocumentModal.tsx`, `AuthForm.tsx`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `QrCode` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._