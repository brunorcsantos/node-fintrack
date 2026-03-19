# 💰 FinTrack — Controle Financeiro Pessoal

Aplicação web completa para gerenciamento de finanças pessoais com suporte a tema claro/escuro e layout responsivo para mobile e desktop.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
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
- PostgreSQL 15+

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack
```

### 2. Configure o Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e JWT_SECRET
```

```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/fintrack?schema=public"
JWT_SECRET="sua-chave-secreta-longa"
FRONTEND_URL="http://localhost:5173"
PORT=3333
```

```bash
# Gere o Prisma Client
npx prisma generate --schema=prisma/schema.prisma

# Crie as tabelas no banco
npx prisma migrate dev --schema=prisma/schema.prisma --name init

# Inicie o servidor
npm run dev
# API disponível em http://localhost:3333
```

### 3. Configure o Frontend

```bash
cd ../frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3333
```

```bash
# Inicie o servidor de desenvolvimento
npm run dev
# App disponível em http://localhost:5173
```

### 4. (Opcional) Popule o banco com dados de exemplo

```bash
cd backend
npx tsx prisma/seed.ts seu@email.com
```

---

## 🔌 Endpoints da API

| Método | Rota | Autenticação | Descrição |
|--------|------|:---:|-----------|
| POST | `/auth/register` | ❌ | Criar conta |
| POST | `/auth/login` | ❌ | Login → JWT |
| GET | `/auth/me` | ✅ | Dados do usuário |
| GET | `/transactions` | ✅ | Listar com filtros |
| POST | `/transactions` | ✅ | Criar transação |
| PUT | `/transactions/:id` | ✅ | Atualizar |
| DELETE | `/transactions/:id` | ✅ | Remover |
| GET | `/transactions/summary` | ✅ | Dados para gráficos |
| GET | `/categories` | ✅ | Listar com subcategorias |
| POST | `/categories` | ✅ | Criar categoria |
| PUT | `/categories/:id` | ✅ | Atualizar |
| DELETE | `/categories/:id` | ✅ | Remover |
| POST | `/categories/:id/subcategories` | ✅ | Criar subcategoria |
| PUT | `/categories/:id/subcategories/:subId` | ✅ | Atualizar subcategoria |
| DELETE | `/categories/:id/subcategories/:subId` | ✅ | Remover subcategoria |
| GET | `/budgets` | ✅ | Listar orçamentos |
| PUT | `/budgets` | ✅ | Criar ou atualizar |
| DELETE | `/budgets/:id` | ✅ | Remover |

---

## 🗄️ Schema do Banco de Dados

```
User
 ├── Category (1:N)
 │    └── Subcategory (1:N)
 ├── Transaction (1:N) → Category → Subcategory
 └── Budget (1:N) → Category → Subcategory
```

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| Fastify | 4 | Servidor HTTP |
| TypeScript | 5 | Tipagem estática |
| Prisma | 5 | ORM |
| PostgreSQL | 15+ | Banco de dados |
| JWT | — | Autenticação |
| Zod | 3 | Validação de schemas |
| bcryptjs | — | Hash de senhas |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 | UI |
| TypeScript | 5 | Tipagem estática |
| Vite | 5 | Bundler |
| Recharts | 2 | Gráficos |
| emoji-picker-element | — | Seletor de emojis |

---

## 🔮 Próximos Passos

- [ ] Deploy — Vercel (frontend) + Render/Fly.io (backend)
- [ ] Edição de lançamentos
- [ ] Perfil do usuário (alterar nome e senha)
- [ ] Paginação nos lançamentos
- [ ] Exportar relatórios em PDF
- [ ] Busca e filtros avançados por descrição
- [ ] Notificações de orçamento próximo do limite

---

## 📄 Licença

MIT
