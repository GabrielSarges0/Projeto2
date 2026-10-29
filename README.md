# Fundação Manuel Cruz - Sistema de Gestão Financeira e Patrimonial (Projeto 2)

Sistema integrado para gestão patrimonial e financeira da **Fundação Manuel Cruz**, com controle de imóveis, inquilinos, receitas de aluguéis e despesas operacionais (manutenção, reformas, serviços).

---

## 🏛️ Arquitetura

O projeto é dividido em uma arquitetura desacoplada:

- **Backend (`/backend`)**:
  - **Framework**: Spring Boot 4 (Java 21).
  - **Persistência**: Spring Data JPA com Hibernate.
  - **Banco de Dados**: PostgreSQL no Supabase (projeto `Projeto2-FMC`, schema `projeto2`) em produção; H2 em modo arquivo (`./data/projeto2`) só para rodar localmente.
  - **Migrações**: Flyway (`db/migration/V3__financial_transactions.sql`).
  - **Segurança**: Spring Security com CORS configurado para Next.js.
  - **Validações**: Bean Validation com validador de CPF/CNPJ brasileiro.

- **Frontend (`/frontend`)**:
  - **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
  - **Estilização**: CSS Modules + Tailwind CSS v4.
  - **Ícones**: Lucide React.
  - **Módulos**: Visão Geral (Dashboard Home), Painel Financeiro, Estoque, Funcionários, Governança, Ministério Público, Documentos e Configurações.

## ☁️ Produção (nada depende de computador local)

| Parte | Onde roda | Como publica |
|---|---|---|
| Frontend (`/frontend`) | Vercel | A cada push na `main` (integração Vercel ↔ GitHub, *Root Directory* = `frontend`) |
| Backend (`/backend`) | Render, plano free (`render.yaml`, `backend/Dockerfile`) | A cada push na `main` que altere `backend/` |
| Banco | Supabase `Projeto2-FMC` (sa-east-1), schema `projeto2`, usuário `projeto2_app` | Migrations Flyway rodam ao iniciar o backend |

- O backend usa o perfil `prod` (`application-prod.properties`) e lê `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `APP_ADMIN_USER` e `APP_ADMIN_PASSWORD` do Render — nunca do Git.
- **Login:** toda a API exige usuário e senha (HTTP Basic sobre HTTPS); o frontend pede em `/login` e guarda só na aba aberta (`sessionStorage`). Localmente, sem variáveis, o login é `admin` / `admin12345`.
- O frontend lê a URL da API de `frontend/.env.production` (`NEXT_PUBLIC_API_URL`).
- No plano gratuito o Render hiberna após 15 min sem acesso: a primeira requisição depois disso leva ~1 min.

## 🌐 Acesso Online (Vercel)

- **Produção:** [https://projetocesarschool.vercel.app](https://projetocesarschool.vercel.app) (projeto `projeto_dois` na Vercel)
- **API:** [https://projeto2-fmc-api.onrender.com/actuator/health](https://projeto2-fmc-api.onrender.com/actuator/health)

## 💻 Editar de qualquer computador (GitHub Codespaces)

1. No GitHub: **Code → Codespaces → Create codespace on main**.
2. O `.devcontainer/` instala Java 21, Node 24 e as dependências; a cada início faz `git pull`.
3. Frontend com os dados reais: `cd frontend && npm run dev` (usa a API publicada, definida no secret `NEXT_PUBLIC_API_URL`).
4. Backend local: `cd backend && ./mvnw spring-boot:run` usa H2 local. Com `SPRING_PROFILES_ACTIVE=prod` usa o banco real e aplica nele as migrations pendentes.

Os segredos ficam em **Settings → Secrets and variables → Codespaces**: `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `APP_ADMIN_USER`, `APP_ADMIN_PASSWORD`.

---

## 🚀 Como Executar Localmente

### Opção 1: Inicialização em 1 Clique (Recomendado)
Execute no terminal na raiz de `ProjetoDois`:
```powershell
.\iniciar.ps1
```
*(Ou dê um duplo clique em `iniciar.bat` no Windows).*

Esse comando:
1. Sobe o backend Java em `http://localhost:8080`.
2. Sobe o frontend Next.js em `http://localhost:3000`.

### Opção 2: Manualmente em dois terminais

**Terminal 1 (Backend):**
```powershell
cd backend
.\mvnw spring-boot:run
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

---

## 📡 Endpoints da API REST

Base URL: `http://localhost:8080/api/v1/financial`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/summary?month={m}&year={y}` | Retorna total de receitas, despesas e saldo do mês |
| `GET` | `/movements?month={m}&year={y}` | Lista movimentações financeiras do mês |
| `POST` | `/incomes` | Registra nova receita de aluguel (com validação de CPF/CNPJ) |
| `POST` | `/expenses` | Registra nova saída/despesa operacional (prestador, reforma, etc.) |
| `DELETE` | `/transactions/{id}` | Exclui movimentação financeira por ID |
| `GET` | `/actuator/health` | Health check da aplicação (público) |
| `GET` | `/api/v1/auth/me` | Valida o login e devolve o usuário |

Todas as rotas `/api/**` exigem `Authorization: Basic …`.

---

## 🧪 Testes Automatizados

- **Backend (JUnit 5 + Mockito)**:
  ```powershell
  cd backend
  .\mvnw test
  ```
- **Frontend (Lint & Typecheck)**:
  ```powershell
  cd frontend
  npm run lint
  npm run build
  ```

---

## 📁 Estrutura de Pastas

```text
ProjetoDois/
├── backend/            # Aplicação Spring Boot Java 21
│   ├── src/main/java/  # Código-fonte (Controllers, Services, Entidades, Validações)
│   ├── src/main/resources/ # Configurações (application.properties, migrations Flyway)
│   ├── src/test/java/  # Testes unitários e de integração
│   └── mvnw / pom.xml  # Maven Wrapper e dependências
├── frontend/           # Aplicação Web Next.js 16 + React 19
│   ├── src/app/        # Rotas da aplicação (dashboard, financeiro, módulos)
│   ├── src/components/ # Componentes reutilizáveis de UI
│   ├── src/lib/        # Cliente de API e tipos TypeScript
│   └── package.json    # Dependências Node.js
├── backups/            # Backups de releases anteriores e logs históricos
├── iniciar.ps1         # Script unificado de inicialização
├── iniciar.bat         # Atalho de inicialização para Windows
├── requests_R6_3.http  # Exemplos prontos de requisições HTTP para testes
└── VERSION             # Versão da release
```

