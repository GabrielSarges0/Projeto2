# Graph Report - projeto2  (2026-11-13)

## Corpus Check
- 199 files · ~117,498 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 7, .properties 4, .css 3)

## Summary
- 1453 nodes · 4200 edges · 79 communities (49 shown, 30 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 195 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- user/UserRolesIntegrationTest
- lib/qrcodegen
- web-design/SKILL
- reminder/Reminder
- frontend/package
- finance/BrazilianDocumentValidator
- lib/format
- ministerio-publico/page
- lib/financial-api
- lib/signatures
- documentos/page
- finance/TransactionModals
- user/UserService
- store/RecordService
- modelos/page
- references/signatures
- documentos/page
- store/RecordController
- lib/session
- lib/schemas
- finance/FinancialTransaction
- config/SecurityConfig
- funcionarios/page
- documents/NewDocumentModal
- lib/alerts
- finance/FinancialService
- lib/validation
- clientes/page
- property/PropertyRepository
- api/ApiExceptionHandler
- auth/AuthController
- property/Property
- frontend/tsconfig
- finance/FinancialServiceTest
- property/PropertyController
- lib/records
- render
- HISTORICO_PRs
- store/RecordCollection
- property/LeaseContract
- auth/BearerTokenAuthenticationFilter
- layout/Sidebar
- lib/api-client
- store/AppRecord
- auth/AuthForm
- user/UserRole
- migration/V4__reminders_and_properties
- auth/LoginRateLimiter
- auth/SessionTokenService
- documents/SignatureCanvas
- workflows/auditor-acessibilidade
- projeto2/Projeto2BackendApplication
- agents/ajudante-haiku
- agents/cliente-desastrado
- finance/FinancialSummaryResponse
- migration/V3__financial_transactions
- migration/V10__app_user
- public/fmc-icon
- agents/ajudante-sonnet
- migration/V8__app_record
- .devcontainer/setup
- .devcontainer/start
- frontend/AGENTS
- frontend/postcss.config
- public/file
- backend/pom

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
- `Workflow ajudante-haiku (ajudante de leitura, Haiku)` --semantically_similar_to--> `Agente ajudante-haiku (leitura barata, Haiku)`  [INFERRED] [semantically similar]
  .agents/workflows/ajudante-haiku.md → .claude/agents/ajudante-haiku.md
- `Regras de negocio para revisar textos (preco, comissao, prazo, garantia, Anvisa)` --references--> `CLAUDE.md (projeto2)`  [AMBIGUOUS]
  .claude/agents/revisor-textos.md → CLAUDE.md
- `Melhorias autorizadas: nenhuma (gate de autorizacao)` --references--> `Evoluir, nao substituir (paleta, fontes e estrutura mantidas)`  [INFERRED]
  DESIGN.md → .claude/skills/web-design/SKILL.md
- `Medida de linha 45-75 caracteres e entrelinha` --conceptually_related_to--> `Tabela de nao negociaveis (contraste, alvos, tipo, movimento, performance)`  [AMBIGUOUS]
  .claude/skills/web-design/references/typography.md → .claude/skills/web-design/SKILL.md
- `Projeto2 (FMC): Inter + Julius Sans One + Jockey One, navy e dourado, sem melhorias autorizadas` --shares_data_with--> `Melhorias autorizadas: nenhuma (gate de autorizacao)`  [INFERRED]
  .claude/skills/web-design/references/signatures.md → DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pacote web-design: SKILL e 11 referencias** — _claude_skills_web_design_skill, _claude_skills_web_design_references_aesthetics, _claude_skills_web_design_references_brand, _claude_skills_web_design_references_color, _claude_skills_web_design_references_creative_dev, _claude_skills_web_design_references_design_systems, _claude_skills_web_design_references_mcp_servers, _claude_skills_web_design_references_process, _claude_skills_web_design_references_signatures, _claude_skills_web_design_references_typography, _claude_skills_web_design_references_ui_ux, _claude_skills_web_design_references_web [EXTRACTED 1.00]
- **Pacote da skill web-design** — agents_skills_web_design_skill, agents_skills_web_design_references_aesthetics, agents_skills_web_design_references_brand, agents_skills_web_design_references_color, agents_skills_web_design_references_creative_dev, agents_skills_web_design_references_design_systems, agents_skills_web_design_references_mcp_servers, agents_skills_web_design_references_process, agents_skills_web_design_references_signatures, agents_skills_web_design_references_typography, agents_skills_web_design_references_ui_ux, agents_skills_web_design_references_web [EXTRACTED 1.00]
- **Default Next.js public SVG icon set** — frontend_public_globe, frontend_public_next, frontend_public_vercel, frontend_public_window [INFERRED 0.65]
- **Agentes de auditoria e revisao do projeto2** — _claude_agents_auditor_acessibilidade, _claude_agents_auditor_desempenho, _claude_agents_cliente_desastrado, _claude_agents_hacker_etico, _claude_agents_revisor_textos [INFERRED 0.75]
- **Fundação Manuel Cruz brand assets** — frontend_public_fmc_icon, frontend_public_fmc_logo_sidebar, frontend_public_fmc_logo [INFERRED 0.75]
- **Regras de contraste, movimento e performance** — _claude_skills_web_design_skill_non_negotiables, _claude_skills_web_design_references_color_wcag_contrast, _claude_skills_web_design_references_typography_measure, _claude_skills_web_design_references_creative_dev_motion_physics, _claude_skills_web_design_skill_core_web_vitals [INFERRED 0.75]
- **Sequência de PRs #1 a #4 do Projeto2** — historico_prs_pr1_publicacao_nuvem, historico_prs_pr2_seguranca_authgate, historico_prs_pr3_codespaces, historico_prs_pr4_sprint03 [INFERRED 0.75]
- **Ajudantes somente leitura** — claude_agents_ajudante_haiku, claude_agents_ajudante_opus, claude_agents_ajudante_fable, agents_workflows_ajudante_haiku, claude_agents_ajudante_haiku_read_only_rule [INFERRED 0.85]
- **Familia de workflows wrapper de auditoria** — agents_workflows_auditor_acessibilidade, agents_workflows_auditor_desempenho, agents_workflows_cliente_desastrado, agents_workflows_hacker_etico, agents_workflows_revisor_textos, agents_workflows_auditor_acessibilidade_wrapper_pattern [INFERRED 0.85]

## Communities (79 total, 30 thin omitted)

### Community 0 - "user/UserRolesIntegrationTest"
Cohesion: 0.10
Nodes (5): AlertDigestIntegrationTest, ApiFlowsIntegrationTest, AuthSecurityTest, Projeto2BackendApplicationTests, UserRolesIntegrationTest

### Community 1 - "lib/qrcodegen"
Cohesion: 0.08
Nodes (13): appendBits(), assert(), bit, byte, Ecc, getBit(), int, Mode (+5 more)

### Community 2 - "web-design/SKILL"
Cohesion: 0.06
Nodes (17): auditor-acessibilidade (agente), WCAG 2.2 AA (teclado, leitor de tela, contraste, alvos, zoom 200%), auditor-desempenho (agente), revisor-textos (agente), Regras de negocio para revisar textos (preco, comissao, prazo, garantia, Anvisa), bibliotecas-de-design SKILL.md, Catalogo de bibliotecas aprovadas (GSAP, Motion, Three.js, Cult UI, Spell UI, Uiverse e outras), Anatomia de design system (tokens em tres niveis, componentes, padroes, docs) (+9 more)

### Community 3 - "reminder/Reminder"
Cohesion: 0.09
Nodes (17): CreateReminderRequest, Reminder, ReminderDetails, ReminderCategory, CONTRATO, FINANCEIRO, IMOVEL, OPERACIONAL (+9 more)

### Community 4 - "frontend/package"
Cohesion: 0.06
Nodes (45): eslintConfig, dependencies, clsx@^2.1.1, date-fns@^4.4.0, @hookform/resolvers@^5.9.1, lucide-react@^1.48.0, next@16.3.6, react@19.2.8 (+37 more)

### Community 5 - "finance/BrazilianDocumentValidator"
Cohesion: 0.08
Nodes (7): AlertDigestService, UserAlertItem, AlertEmailSender, AlertScheduler, HttpOrLogAlertEmailSender, BrazilianDocumentValidator, BrazilianDocumentValidatorTest

### Community 6 - "lib/format"
Cohesion: 0.12
Nodes (36): EstoquePage(), InventoryHistory(), SaveItem, SaveMovement, FinanceiroPage(), PropertyDetailsModal(), emptySummary, FinancialDashboard() (+28 more)

### Community 7 - "ministerio-publico/page"
Cohesion: 0.09
Nodes (28): nextConfig, EquipePage(), changeRole(), replace(), ROLE_HELP, EMPTY_FILTERS, Filters, inPeriod() (+20 more)

### Community 8 - "lib/financial-api"
Cohesion: 0.07
Nodes (37): ChartPoint, FormErrors, Info(), Notify, contractSchema, CreateExpenseRequest, CreateIncomeRequest, CurrentUser (+29 more)

### Community 9 - "lib/signatures"
Cohesion: 0.11
Nodes (31): DocumentPreview(), Props, Props, SignatureBlock(), Props, SignatureVerifyModal(), CreateDocumentInput, FOLDER_IDS (+23 more)

### Community 10 - "documentos/page"
Cohesion: 0.14
Nodes (32): DocumentosPage(), confirmDeleteDoc(), download(), DocumentRow(), NewDocState, PROTECTED_FOLDERS, MinisterioPublicoPage(), downloadAll() (+24 more)

### Community 11 - "finance/TransactionModals"
Cohesion: 0.13
Nodes (34): selectProperty(), FormErrors, nextCode(), PRICE_RANGES, PropertyFormModal(), handleSubmit(), STATUS_BADGE, CommonProps (+26 more)

### Community 12 - "user/UserService"
Cohesion: 0.16
Nodes (7): AppUser, AppUserRepository, ActiveRequest, RoleRequest, UserController, UserResponse, UserService

### Community 13 - "store/RecordService"
Cohesion: 0.12
Nodes (3): NotFoundException, CurrentUser, RecordService

### Community 14 - "modelos/page"
Cohesion: 0.10
Nodes (31): ALIGN_LABEL, FONT_LABEL, ModelosPage(), select(), normalize(), sameLayout(), sectionTitle, setModelInUrl() (+23 more)

### Community 15 - "references/signatures"
Cohesion: 0.09
Nodes (27): Skill bibliotecas-de-design (catalogo de bibliotecas aprovadas), Referencia aesthetics (fugir do visual generico de IA), Referencia brand (guia de marca e narrativa), Narrativa hero, prova e CTA, Referencia color (paletas, escalas, contraste), Contraste WCAG: 4.5:1 texto, 3:1 texto grande e componentes de UI, Referencia creative-dev (3D, motion, estetica premium), 3D e WebGL carregado sob demanda, com poster como LCP (+19 more)

### Community 16 - "documentos/page"
Cohesion: 0.21
Nodes (31): attachDocument(), EditDocumentModal(), handleSubmit(), FolderFormModal(), handleSubmit(), ScanModal(), handleSubmit(), EditItemModal() (+23 more)

### Community 17 - "store/RecordController"
Cohesion: 0.18
Nodes (3): AlertController, RecordController, RecordResponse

### Community 18 - "lib/session"
Cohesion: 0.12
Nodes (24): metadata, RootLayout(), PerfilPage(), handleImageUpload(), handleLogout(), handleSaveSignature(), handleSubmit(), AuthGate() (+16 more)

### Community 19 - "lib/schemas"
Cohesion: 0.07
Nodes (28): ATTENDANCE_STATUSES, attendanceSchema, clientDocumentSchema, CONTRACT_STATUSES, documentFilePartSchema, documentSignatureSchema, EMPLOYEE_ROLES, EMPLOYEE_SITUATIONS (+20 more)

### Community 20 - "finance/FinancialTransaction"
Cohesion: 0.12
Nodes (8): BrazilianDocumentType, CNPJ, CPF, FinancialTransaction, FinancialTransactionRepository, FinancialTransactionType, EXPENSE, INCOME

### Community 23 - "funcionarios/page"
Cohesion: 0.14
Nodes (24): AttendanceEditModal(), handleSubmit(), captureLocation(), EmployeesStore, EmployeeView(), punch(), expectedMinutes(), formatMinutes() (+16 more)

### Community 24 - "documents/NewDocumentModal"
Cohesion: 0.13
Nodes (23): BackButton(), choiceStyle, FileForm(), FolderSelect(), NewDocumentModal(), Props, Step, TemplateForm() (+15 more)

### Community 25 - "lib/alerts"
Cohesion: 0.12
Nodes (24): AlertasPage(), PreferencesForm(), handleSubmit(), ALERT_KIND_LABEL, ALERT_KINDS, AlertItem, AlertKind, AlertPrefs (+16 more)

### Community 27 - "finance/FinancialService"
Cohesion: 0.19
Nodes (5): CreateExpenseRequest, CreateIncomeRequest, FinancialController, FinancialMovementResponse, FinancialService

### Community 28 - "lib/validation"
Cohesion: 0.23
Nodes (20): addMonthsIso(), ClientFormModal(), handleSubmit(), validate(), FormState, STATUS_BADGE, toForm(), EmployeeForm() (+12 more)

### Community 29 - "clientes/page"
Cohesion: 0.14
Nodes (21): ClientDetails(), ClientesPage(), confirmRenew(), DisplayStatus, displayStatus(), ImoveisPage(), handleSaved(), HomePage() (+13 more)

### Community 30 - "property/PropertyRepository"
Cohesion: 0.18
Nodes (4): LeaseContractRepository, PropertyRepository, ReminderRepository, AppRecordRepository

### Community 31 - "api/ApiExceptionHandler"
Cohesion: 0.22
Nodes (3): ApiErrorResponse, ApiExceptionHandler, ForbiddenException

### Community 32 - "auth/AuthController"
Cohesion: 0.19
Nodes (5): AuthController, CurrentUserResponse, LoginRequest, LoginResponse, UpdateProfileRequest

### Community 34 - "property/Property"
Cohesion: 0.19
Nodes (6): Property, PropertyDetails, PropertyStatus, DISPONIVEL, MANUTENCAO, OCUPADO

### Community 35 - "frontend/tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 37 - "property/PropertyController"
Cohesion: 0.22
Nodes (5): PropertyController, PropertyMetricsResponse, PropertyRequest, PropertyResponse, PropertyService

### Community 38 - "lib/records"
Cohesion: 0.20
Nodes (17): apiRequest(), apiRequestVoid(), applyLocalUpsert(), CollectionName, CollectionState, deleteRecord(), fetchRecord(), fetchRecords() (+9 more)

### Community 39 - "render"
Cohesion: 0.11
Nodes (17): paths, generateValue, key, sync, value, services, autoDeploy, buildFilter (+9 more)

### Community 40 - "HISTORICO_PRs"
Cohesion: 0.14
Nodes (14): Estado do Projeto2 em 09/11/2026 (continuidade), Pendências por prioridade (Roteiro de homologação Sprint 4, validação de impressão/PDF), Guia padrão create-next-app do frontend (npm run dev, Vercel), PR #1 Publicação Full-Stack na Nuvem (Supabase + Render + Vercel), PR #2 Governança de Segurança e Autenticação HTTP Basic / AuthGate, PR #3 Ambiente Padronizado no GitHub Codespaces com Dados Reais, PR #4 Sprint 03 Completa e Novos Módulos do Cliente, Mapeamento de Sessões Claude Code e Antigravity (sessões cruzadas) (+6 more)

### Community 41 - "store/RecordCollection"
Cohesion: 0.13
Nodes (12): RecordCollection, ATTENDANCE, CLIENTS, DOCUMENT_FILES, DOCUMENTS, EMPLOYEES, FOLDERS, INVENTORY (+4 more)

### Community 44 - "layout/Sidebar"
Cohesion: 0.23
Nodes (10): items, Sidebar(), handleLogout(), Topbar(), handleLogout(), resetAlertsCache(), useAlerts(), logout() (+2 more)

### Community 45 - "lib/api-client"
Cohesion: 0.22
Nodes (9): API_URL, ApiError, apiErrorBodySchema, NetworkError, RequestOptions, send(), UnauthorizedError, getAuthToken() (+1 more)

### Community 47 - "auth/AuthForm"
Cohesion: 0.24
Nodes (8): CadastroPage(), LoginPage(), AuthForm(), handleSubmit(), validate(), Errors, Mode, authApi

### Community 49 - "user/UserRole"
Cohesion: 0.24
Nodes (6): AuthenticatedUser, UserRole, ADMINISTRADOR, FUNCIONARIO, GERENTE, CachedUser

### Community 50 - "migration/V4__reminders_and_properties"
Cohesion: 0.31
Nodes (7): idx_lease_contract_end_date, idx_property_status, idx_reminder_done, lease_contract, property, reminder, idx_reminder_done_due_date

### Community 51 - "auth/LoginRateLimiter"
Cohesion: 0.32
Nodes (3): LoginRateLimiter, TooManyRequestsException, Window

### Community 52 - "auth/SessionTokenService"
Cohesion: 0.39
Nodes (3): IssuedToken, SessionTokenService, SessionUser

### Community 53 - "documents/SignatureCanvas"
Cohesion: 0.38
Nodes (4): SignatureCanvas(), getCoords(), handlePointerDown(), handlePointerMove()

### Community 54 - "workflows/auditor-acessibilidade"
Cohesion: 0.33
Nodes (6): Workflow auditor-acessibilidade (WCAG 2.2 AA), Padrao de workflow wrapper que delega ao agente em .claude/agents, Workflow auditor-desempenho (LCP, INP, CLS), Workflow cliente-desastrado (testes de uso desajeitado), Workflow hacker-etico (teste de seguranca autorizado), Workflow revisor-textos (revisao de textos em portugues)

### Community 56 - "agents/ajudante-haiku"
Cohesion: 0.60
Nodes (4): Workflow ajudante-haiku (ajudante de leitura, Haiku), Agente ajudante-fable (ultimo recurso, mais caro), Agente ajudante-haiku (leitura barata, Haiku), Agente ajudante-opus (decisoes dificeis, Opus)

### Community 59 - "migration/V3__financial_transactions"
Cohesion: 0.83
Nodes (3): financial_transaction, idx_financial_transaction_date, idx_financial_transaction_type_date

### Community 61 - "public/fmc-icon"
Cohesion: 1.00
Nodes (3): FMC emblem icon (Fundação Manuel Cruz), FMC stacked logo (Fundação Manuel Cruz, Gestão de Imóveis), FMC horizontal logo for sidebar (Manuel Cruz, Gestão de Imóveis)

## Ambiguous Edges - Review These
- `CLAUDE.md (projeto2)` → `Regras de negocio para revisar textos (preco, comissao, prazo, garantia, Anvisa)`  [AMBIGUOUS]
  .claude/agents/revisor-textos.md · relation: references
- `Tabela de nao negociaveis (contraste, alvos, tipo, movimento, performance)` → `Medida de linha 45-75 caracteres e entrelinha`  [AMBIGUOUS]
  .claude/skills/web-design/references/typography.md · relation: conceptually_related_to
- `Camadas de tokens: primitivo, semantico, componente` → `Anatomia de design system (tokens em tres niveis, componentes, padroes, docs)`  [AMBIGUOUS]
  .claude/skills/web-design/references/ui-ux.md · relation: conceptually_related_to

## Knowledge Gaps
- **53 isolated node(s):** `br.org.fundacaomanuelcruz:projeto2-backend`, `CPF`, `CNPJ`, `INCOME`, `EXPENSE` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 354 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UserService` connect `user/UserService` to `auth/AuthController`, `user/UserRolesIntegrationTest`, `auth/BearerTokenAuthenticationFilter`, `store/RecordService`, `store/RecordController`, `user/UserRole`, `auth/LoginRateLimiter`, `config/SecurityConfig`, `auth/LoginRateLimiter`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `br.org.fundacaomanuelcruz:projeto2-backend`, `CPF`, `CNPJ` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `user/UserRolesIntegrationTest` be split into smaller, more focused modules?**
  _Cohesion score 0.09800362976406533 - nodes in this community are weakly interconnected._
- **Why does `errorMessage()` connect `documentos/page` to `lib/format`, `ministerio-publico/page`, `lib/financial-api`, `lib/records`, `documentos/page`, `finance/TransactionModals`, `lib/api-client`, `modelos/page`, `auth/AuthForm`, `lib/session`, `funcionarios/page`, `documents/NewDocumentModal`, `lib/alerts`, `lib/validation`, `clientes/page`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `lib/qrcodegen` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `CLAUDE.md (projeto2)` and `Regras de negocio para revisar textos (preco, comissao, prazo, garantia, Anvisa)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Tabela de nao negociaveis (contraste, alvos, tipo, movimento, performance)` and `Medida de linha 45-75 caracteres e entrelinha`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._