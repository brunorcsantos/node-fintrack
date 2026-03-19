# 💰 FinTrack — Controle Financeiro Pessoal

Stack completa: **React + TypeScript · Fastify · Prisma · PostgreSQL**

---

## 📁 Estrutura do Projeto

```
fintrack/
├── backend/                  # API Fastify
│   ├── prisma/
│   │   └── schema.prisma     # Modelos do banco de dados
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts     # Cliente Prisma singleton
│   │   ├── middleware/
│   │   │   └── auth.ts       # Verificação JWT
│   │   ├── routes/
│   │   │   ├── auth.ts       # Login, registro, /me
│   │   │   ├── transactions.ts
│   │   │   ├── categories.ts
│   │   │   └── budgets.ts
│   │   └── server.ts         # Entry point Fastify
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── lib/
    │   │   └── api.ts        # HTTP client tipado
    │   ├── hooks/
    │   │   └── useAuth.ts    # Context de autenticação
    │   └── App.tsx           # Componente principal (finance-tracker.tsx)
    ├── .env.example
    └── package.json
```

---

## 🚀 Setup — Passo a Passo

### 1. Banco de dados PostgreSQL

Escolha uma das opções abaixo (todas têm plano gratuito):

**Opção A — Supabase (recomendado)**
1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings → Database → Connection string → URI**
4. Copie a connection string

**Opção B — Neon**
1. Acesse https://neon.tech e crie uma conta
2. Crie um novo projeto
3. Copie a connection string da dashboard

**Opção C — Local com Docker**
```bash
docker run --name fintrack-db \
  -e POSTGRES_PASSWORD=fintrack123 \
  -e POSTGRES_DB=fintrack \
  -p 5432:5432 -d postgres:16
# DATABASE_URL="postgresql://postgres:fintrack123@localhost:5432/fintrack"
```

---

### 2. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL e um JWT_SECRET forte

# Gerar client Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:migrate

# Iniciar em modo desenvolvimento
npm run dev
# API disponível em http://localhost:3333
```

---

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite se necessário (padrão aponta para localhost:3333)

# Iniciar em modo desenvolvimento
npm run dev
# App disponível em http://localhost:5173
```

---

## 🔌 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login → retorna JWT |
| GET | `/auth/me` | Dados do usuário logado |

### Transações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions` | Listar (filtros: month, categoryId, type, page) |
| POST | `/transactions` | Criar transação |
| PUT | `/transactions/:id` | Atualizar |
| DELETE | `/transactions/:id` | Remover |
| GET | `/transactions/summary` | Dados agregados para gráficos |

### Categorias
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categories` | Listar com subcategorias |
| POST | `/categories` | Criar categoria |
| PUT | `/categories/:id` | Atualizar |
| DELETE | `/categories/:id` | Remover |
| POST | `/categories/:id/subcategories` | Criar subcategoria |
| DELETE | `/categories/:id/subcategories/:subId` | Remover subcategoria |

### Orçamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/budgets` | Listar (filtro: month) |
| PUT | `/budgets` | Criar ou atualizar (upsert) |
| DELETE | `/budgets/:id` | Remover |

---

## 🗄️ Schema do Banco de Dados

```
User
 ├── Category (1:N)
 │    └── Subcategory (1:N)
 ├── Transaction (1:N)
 │    ├── → Category
 │    └── → Subcategory (opcional)
 └── Budget (1:N)
      ├── → Category (opcional)
      └── → Subcategory (opcional)
```

---

## 🔐 Autenticação

A API usa **JWT Bearer Token**. Após login/registro, inclua o token em todas as requisições:

```
Authorization: Bearer <token>
```

O frontend guarda o token no `localStorage` via `api.setToken()`.

---

## 🌐 Deploy em Produção

**Backend (Railway ou Render):**
```bash
npm run build
# Configure as variáveis de ambiente no painel do serviço
# Comando de start: node dist/server.js
```

**Frontend (Vercel ou Netlify):**
```bash
npm run build
# Defina VITE_API_URL com a URL da API em produção
```

**Variáveis de ambiente em produção:**
```env
# Backend
DATABASE_URL="postgresql://..."
JWT_SECRET="string-aleatoria-longa-e-segura"
FRONTEND_URL="https://seu-app.vercel.app"

# Frontend
VITE_API_URL="https://sua-api.railway.app"
```

---

## 📦 Dependências

**Backend:**
- `fastify` — servidor HTTP performático
- `@fastify/jwt` — autenticação JWT
- `@fastify/cors` — CORS configurável
- `@prisma/client` — ORM tipado
- `bcryptjs` — hash de senhas
- `zod` — validação de schemas

**Frontend:**
- `react` + `react-dom`
- `recharts` — gráficos
- `typescript` + `vite`
