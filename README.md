# 💰 FinTrack — Controle Financeiro Pessoal

Aplicação web moderna para gerenciamento de finanças pessoais com suporte a tema claro/escuro, layout responsivo e autenticação JWT.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Stack](https://img.shields.io/badge/Backend-Fastify%20%2B%20Prisma-green)
![Stack](https://img.shields.io/badge/Banco-PostgreSQL-336791)

---

## ✨ Funcionalidades

- **Autenticação** — Registro e login com JWT, redirecionamento automático ao expirar sessão
- **Dashboard** — Visão geral com cards de receitas, despesas e saldo, gráfico de pizza e últimos lançamentos
- **Lançamentos** — CRUD de transações com filtro por mês e categoria
- **Orçamentos** — Definição de metas mensais por categoria com barra de progresso
- **Relatórios** — Gráficos de barras e linha com dados reais da API, distribuição por categoria
- **Configurações** — Gerenciamento de categorias e subcategorias com EmojiPicker e ColorPicker
- **Tema claro/escuro** — Alternância com detecção automática da preferência do sistema
- **Responsivo** — Layout adaptado para mobile (360px) e desktop (1200px+)
- **Multi-usuário** — Cada usuário possui suas próprias categorias, transações e orçamentos

---

## 🗂️ Estrutura do Projeto

```
fintrack/
├── backend/                        # API REST
│   ├── prisma/
│   │   ├── schema.prisma           # Modelos do banco de dados
│   │   └── seed.ts                 # Dados iniciais para testes
│   ├── src/
│   │   ├── lib/prisma.ts           # Cliente Prisma singleton
│   │   ├── middleware/auth.ts      # Verificação JWT
│   │   ├── routes/
│   │   │   ├── auth.ts             # Login, registro, /me
│   │   │   ├── transactions.ts     # CRUD de transações + summary
│   │   │   ├── categories.ts       # CRUD de categorias e subcategorias
│   │   │   └── budgets.ts          # CRUD de orçamentos
│   │   └── server.ts               # Entry point Fastify
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                       # Aplicação React
    └── src/
        ├── components/
        │   ├── AddModal.tsx         # Modal de novo lançamento
        │   ├── AuthenticatedApp.tsx # App principal pós-login
        │   ├── Badge.tsx
        │   ├── ColorPicker.tsx      # Seletor de cor com presets
        │   ├── EmojiPicker.tsx      # Seletor de emoji (emoji-picker-element)
        │   ├── ErrorMessage.tsx
        │   ├── Filters.tsx          # Filtros de mês e categoria
        │   ├── Header.tsx           # Navegação + toggle de tema
        │   ├── LoadingSpinner.tsx
        │   └── ProgressBar.tsx
        ├── context/
        │   ├── AuthContext.tsx      # Estado de autenticação global
        │   └── ThemeContext.tsx     # Tema claro/escuro + CSS variables
        ├── hooks/
        │   ├── useCategories.ts
        │   ├── useTransactions.ts
        │   ├── useBudgets.ts
        │   └── useSummary.ts
        ├── lib/
        │   └── api.ts              # HTTP client tipado
        ├── styles/
        │   └── index.ts            # Tokens de design com CSS variables
        ├── types/
        │   └── index.ts            # Tipos globais TypeScript
        ├── helpers/
        │   └── index.ts            # Funções utilitárias
        ├── constants/
        │   ├── categories.ts       # Categorias padrão
        │   └── transactions.ts     # Transações de exemplo
        └── views/
            ├── Auth.tsx            # Tela de login e registro
            ├── Dashboard.tsx
            ├── Transactions.tsx
            ├── Budgets.tsx
            ├── Reports.tsx
            └── Setup.tsx           # Gerenciamento de categorias
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL 15+ (ou use Docker)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack
```

### 2. Setup do Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e JWT_SECRET
```

**Arquivo `.env` esperado:**
```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/fintrack?schema=public"
JWT_SECRET="sua-chave-secreta-muito-longa-min-32-chars"
JWT_REFRESH_SECRET="sua-chave-refresh-muito-longa-min-32-chars"
PORT=3333
```

```bash
# Crie as tabelas no banco de dados
npx prisma migrate dev --name init

# Inicie o servidor (rodará em http://localhost:3333)
npm run dev
```

### 3. Setup do Frontend

```bash
cd ../frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
echo "VITE_API_URL=http://localhost:3333" > .env

# Inicie o servidor de desenvolvimento (rodará em http://localhost:5173)
npm run dev
```

### 4. (Opcional) Popule com dados de exemplo

```bash
cd backend
npx tsx prisma/seed.ts seu@email.com
```

---

## 📦 Desenvolvimento em Paralelo

Para desenvolvimento simultâneo, abra **dois terminais**:

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Acesse http://localhost:5173 no navegador. O frontend já está configurado para se conectar ao backend em http://localhost:3333.

---

## 🏗️ Arquitetura

```
Frontend (React/Vite)          Backend (Fastify/Prisma)
┌─────────────────────┐        ┌──────────────────────┐
│ http://localhost:5173│        │ http://localhost:3333│
├─────────────────────┤        ├──────────────────────┤
│ React Components    │        │ Fastify Routes       │
│ Context (Auth/Theme)│ ◄─────► │ Prisma ORM           │
│ Hooks (API/Data)    │ (JSON)  │ PostgreSQL Schema    │
│ Vite Dev Server     │        │ JWT Auth Middleware  │
└─────────────────────┘        └──────────────────────┘
```

**Fluxo de Comunicação:**
1. Frontend faz requisições HTTP para Backend
2. Backend valida JWT no header `Authorization: Bearer <token>`
3. Response retorna dados JSON
4. Frontend atualiza state React e renderiza

---

## 🔐 Autenticação

O sistema utiliza **JWT com refresh tokens**:

1. **Login** → POST `/auth/login` retorna `accessToken` (15min) + `refreshToken` (7d)
2. **Requisições** → Header `Authorization: Bearer <accessToken>`
3. **Token expira** → Frontend detecta erro 401 e faz POST `/auth/refresh`
4. **Novo accessToken** → Requisição é retentada automaticamente

---

## 🗄️ Schema do Banco de Dados

```
User (1:N)
 ├── Category + Subcategory
 ├── Transaction → Category → Subcategory
 ├── Transaction → CreditCard (transações de cartão)
 ├── Budget → Category
 ├── CreditCard
 ├── CreditCardInvoice
 ├── RecurringTransaction
 └── NotificationLog
```

---

## 🔌 Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|:---:|-----------|
| POST | `/auth/register` | ❌ | Criar conta |
| POST | `/auth/login` | ❌ | Login → JWT |
| POST | `/auth/refresh` | ❌ | Renovar token |
| GET | `/auth/me` | ✅ | Dados do usuário |
| GET | `/transactions` | ✅ | Listar transações |
| POST | `/transactions` | ✅ | Criar transação |
| PUT | `/transactions/:id` | ✅ | Atualizar transação |
| DELETE | `/transactions/:id` | ✅ | Remover transação |
| GET | `/categories` | ✅ | Listar categorias |
| POST | `/categories` | ✅ | Criar categoria |
| PUT | `/categories/:id` | ✅ | Atualizar categoria |
| DELETE | `/categories/:id` | ✅ | Remover categoria |
| GET | `/budgets` | ✅ | Listar orçamentos |
| PUT | `/budgets` | ✅ | Criar/atualizar orçamento |
| DELETE | `/budgets/:id` | ✅ | Remover orçamento |
| GET | `/credit-cards` | ✅ | Listar cartões |
| POST | `/credit-cards` | ✅ | Criar cartão |
| GET | `/notifications` | ✅ | Listar notificações |

---

## � Troubleshooting

### Backend não conecta ao PostgreSQL
```bash
# Verifique se PostgreSQL está rodando
# No Windows: Services → PostgreSQL
# No Mac: brew services list
# No Linux: sudo systemctl status postgresql

# Teste a conexão manualmente
psql "postgresql://user:password@localhost:5432/fintrack"
```

### Frontend mostra erro de conexão
1. Verifique se Backend está rodando: http://localhost:3333
2. Verifique a variável `VITE_API_URL` em `frontend/.env`
3. Abra DevTools (F12) → Network → verifique requests

### Prisma Client outdated
```bash
cd backend
npx prisma generate
npm run dev
```

### Porta 3333 ou 5173 já está em uso
```bash
# Windows: liberar porta 3333
netstat -ano | findstr :3333
taskkill /PID <PID> /F

# Mac/Linux: liberar porta 3333
lsof -ti :3333 | xargs kill -9
```

---

## 📚 Recursos Úteis

- [Fastify Docs](https://www.fastify.io/docs/latest/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 🔮 Roadmap

- [ ] Deploy na Vercel (frontend) + Railway/Render (backend)
- [ ] Edição de transações no modal
- [ ] Perfil do usuário (nome, senha, preferências)
- [ ] Paginação inteligente nos lançamentos
- [ ] Exportar relatórios em PDF
- [ ] Busca full-text por descrição
- [ ] Notificações email de orçamentos
- [ ] Sincronização banco com instituições (Open Banking)
- [ ] App mobile PWA com Capacitor
- [ ] Análise preditiva de gastos (ML)

---

## 📄 Licença

MIT
