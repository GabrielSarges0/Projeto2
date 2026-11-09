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
- **Identidade Visual e Logo Oficial do Figma (Telas 00 e 01 — PR aberto):**
  - Resgatadas diretamente da API do Figma (`IvNhLg0cTwcZo15D5YF9vI`) via integração Composio com a conta proprietária.
  - Imagem oficial da Logo adicionada no topo da barra de navegação lateral (`Sidebar.tsx`), eliminando o espaçamento artificial vazio de `254px`.
  - Responsividade na barra lateral: versão horizontal completa (`187x57`) no desktop e brasão dourado isolado (`44x44`) no menu colapsado/mobile.
  - Logo oficial da Fundação Manuel Cruz na tela de Login/Cadastro (`AuthForm.tsx`), substituindo o ícone genérico do Lucide (`<Landmark>`).
  - Metadados e favicons atualizados no `RootLayout` apontando para a identidade visual da FMC.
- **Assinatura Digital Completa Multi-Modalidade (Backlog 2, tela 2.3 — PR #10 aberto):**
  - 5 modalidades de assinatura:
    1. Carimbo Digital Criptográfico (SHA-256 e selo formal verde).
    2. Desenho Manuscrito na Tela (Canvas HTML5 com suporte a touch, caneta stylus e mouse).
    3. Digitação Caligráfica Cursiva (estilo DocuSign/Gov.br com 4 fontes artísticas/executivas).
    4. Upload de Imagem/Scan de Assinatura (PNG transparente/JPG).
    5. Chancela Institucional de Pessoa Jurídica da Fundação Manoel Cruz (CNPJ 03.245.981/0001-44).
  - QR Code oficial de validação pública gerado em SVG vetorial nativo (ISO/IEC 18004, zero novas dependências npm).
  - Impressão e PDF (`layoutToHtml`) com a assinatura, dados do signatário, hash e QR code perfeitamente diagramados.
  - Card "Minha Assinatura Digital Padrão" no `/perfil` para assinatura em 1 clique em qualquer novo documento.
  - Modal de verificação de autenticidade (`SignatureVerifyModal`) acionado pelo visualizador de documentos ou via escaneamento do QR code (`/documentos?doc={id}&verify=1`).

Produção: o banco ainda não tinha nenhuma conta em 09/11. **A primeira conta que entrar vira Gerente**;
`APP_MANAGER_EMAILS` (Render) garante Gerente para `gabrielsarges1926@gmail.com` e `hbsv@cesar.school`.

## O que falta (por prioridade)

1. **Roteiro de homologação da Sprint 4 (Hannah)**: validação ponta a ponta dos fluxos implementados nas 3 personas (Gerente, Administrador, Funcionário).
2. **Validação da experiência de impressão/PDF de contratos e termos com QR Code de autenticidade.**

## Como verificar antes de abrir PR

```bash
cd backend && ./mvnw -B test
cd frontend && npm run lint && npm run build
```

Para testar no navegador com dados locais: rode o backend (`java -jar backend/target/*.jar`, perfil `r63`, H2)
e o frontend com `NEXT_PUBLIC_API_URL=http://localhost:8080`. Apague `backend/data` para começar do zero.

## Regras que não podem ser esquecidas

- Branch própria → PR para a `main`. Merge com **rebase** (a Vercel bloqueia commits de quem não é do time).
- Se a API mudar: publique o backend (Render) **antes** do frontend.
- Mudança de banco só por nova migration Flyway; qualquer escrita no banco de produção exige confirmação do usuário.
- Nada de segredos no Git; preferências e dados pessoais não vão para logs nem para fixtures.
