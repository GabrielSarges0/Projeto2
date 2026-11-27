# Continuidade do Projeto2

Consulte o [guia de desenvolvimento](DESENVOLVIMENTO.md) para fluxo, deploy e banco e o [README](../README.md) para arquitetura, papéis e endpoints.

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
- **Pacote Completo de Melhorias Funcionais da Plataforma (PR aberto):**
  - **Exportação de Dados em Planilha (Excel .xlsx):** Exportação formatada em `frontend/src/lib/export-spreadsheet.ts` (biblioteca `write-excel-file`, carregada só no clique), com faixa da Fundação, título, data de geração, cabeçalho fixo nas cores do `DESIGN.md`, valores em R$ e datas reais, e resumo no fim. Substituiu a exportação CSV anterior. Módulos:
    - *Financeiro:* Exportação de extrato mensal e histórico completo com formatação em R$ e vínculo de imóveis.
    - *Clientes:* Exportação de cadastro com contratos, e-mails, telefones e valores de aluguel.
    - *Estoque:* Exportação de inventário completo com status de reposição (Normal, Baixo, Esgotado).
    - *Funcionários:* Exportação do espelho de ponto de cada colaborador no modal de histórico ("reloginho").
  - **Diagramação e Impressão Oficial de Documentos em PDF:** Estilos de impressão `@page { size: A4 }` e cabeçalho timbrado estatutário da Fundação Manuel Cruz em `layoutToHtml`, permitindo impressão e download direto de PDFs com formatação impecável.
  - **Upload com Drag & Drop e Pré-visualização:** Nova zona de soltura de arquivos em `NewDocumentModal` com feedback visual imediato, tamanho formatado e botão de troca rápida.
  - **Orientações de Acesso e Ajuda Institucional no Login:** Atualizado o diálogo de ajuda no `AuthForm` para explicar com clareza a autenticação simplificada e o modelo de perfis da FMC.
- **Identidade Visual e Logo Oficial do Figma (Telas 00 e 01 — PR aberto):**
  - Resgatadas diretamente da API do Figma (`IvNhLg0cTwcZo15D5YF9vI`).
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

Produção: as contas `gabrielsarges1926@gmail.com` e `hbsv@cesar.school` têm garantia nativa de papel **Gerente** no código (`UserService.java`) e fallback em propriedades, além da primeira conta a entrar virar Gerente.

## O que falta (por prioridade)

1. **Roteiro de homologação da Sprint 4 (Hannah)**: validação ponta a ponta dos fluxos implementados nas 3 personas (Gerente, Administrador, Funcionário).
2. **Validação da experiência de impressão/PDF de contratos e termos com QR Code de autenticidade.**
3. **Desligar o modo de teste do MVP antes de dados reais da equipe**: com `APP_ALL_MANAGERS=true` (padrão no Render) toda conta que entra vira Gerente e, portanto, enxerga a ficha da equipe (dados pessoais). Defina `APP_ALL_MANAGERS=false` no Render ao fim do teste.

## Feito a partir do relatório de teste (22/11/2026)
- **Documentos — arrastar e soltar (4.1):** documentos arrastados para uma pasta (ou para o caminho no topo) são movidos; arquivos do computador soltos numa pasta abrem "Enviar arquivo" já preenchido. Pelo teclado continua "Renomear / mover".
- **Equipe — ficha completa (4.2):** ficha por conta com dados pessoais, edição e contrato vinculado (documento existente ou arquivo novo em Documentos › Funcionários). Coleção `team-profiles` no `app_record` (sem migration), lida e gravada só pelo Gerente (`SecurityConfig`).

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
