# 📚 Development Workflow — Novo Padrão

Este documento descreve o workflow **correto e recomendado** para trabalhar no FinTrack após a remoção do Electron.

---

## 🎯 Princípios

1. **Backend e Frontend são independentes**
   - Backend: Node.js + Fastify rodando como API
   - Frontend: React rodando no navegador

2. **Sem IPC, sem complexidade**
   - Comunicação via HTTP JSON
   - Facilita debug, testes, deploy

3. **Desenvolvimento em paralelo**
   - Terminal 1: Backend rodando
   - Terminal 2: Frontend rodando
   - Browser: Acessa Frontend, que chama Backend

---

## 🚀 Setup Inicial (Primeira Vez)

### 1. Clone e instale dependências

```bash
git clone <repo> node-fintrack
cd node-fintrack

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure variáveis de ambiente

**Backend (`backend/.env`):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fintrack?schema=public"
JWT_SECRET="sua-chave-super-secreta-com-32-chars-minimo"
JWT_REFRESH_SECRET="sua-chave-refresh-super-secreta-32-chars"
PORT=3333
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3333
```

### 3. Setup do banco de dados

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed              # (opcional) popula dados de teste
cd ..
```

---

## 💻 Desenvolvimento Diário

### Opção A: Two Terminals (Recomendado)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Resultado esperado:
# ✔ Server listening at http://0.0.0.0:3333
```

```bash
# Terminal 2: Frontend (novo terminal)
cd frontend
npm run dev

# Resultado esperado:
# ✔ VITE ready in XXX ms
# ➜  Local: http://localhost:5173/
```

Depois acesse **http://localhost:5173** no navegador.

### Opção B: Single Command (Experimental)

```bash
# Na raiz do projeto
npm run dev
```

Este comando está configurado em `package.json` para rodar frontend apenas.
**Para backend, voce ainda precisa de um terminal separado.**

---

## 🔧 Tarefas Comuns

### Alterar Backend API

1. Edite arquivos em `backend/src/routes/`
2. Backend recompila automaticamente (watch mode)
3. Frontend continua rodando (reinicie apenas se mudar tipos)

**Exemplo: Adicionar novo endpoint**

```typescript
// backend/src/routes/example.ts
export async function setupExampleRoutes(app: FastifyInstance) {
  app.get("/example", async (request, reply) => {
    return { message: "Hello from new endpoint" };
  });
}
```

Adicione a rota em `backend/src/server.ts`:
```typescript
import { setupExampleRoutes } from "./routes/example";
// ...
setupExampleRoutes(app);
```

Backend sofre hot-reload automático ✅

### Alterar Frontend UI

1. Edite arquivos em `frontend/src/components/`
2. Vite recompila automaticamente (hot module replacement)
3. Browser atualiza em tempo real

**Exemplo: Adicionar nova página**

```tsx
// frontend/src/views/Example.tsx
export function ExampleView() {
  return <div>Nova página!</div>;
}
```

Atualize router em `frontend/src/main.tsx` ou `App.tsx` e veja a mudança no navegador 🔄

### Alterar Schema do Banco de Dados

1. Edite `backend/prisma/schema.prisma`
2. Execute:
   ```bash
   cd backend
   npx prisma migrate dev --name "descricao-da-mudanca"
   ```
3. Prisma atualiza BD e gera tipos TypeScript
4. Backend você pode deixar rodando (vai pegar tipos novos)

**Exemplo: Adicionar novo campo**

```prisma
model Transaction {
  id          String   @id @default(cuid())
  description String
  amount      Float
  date        DateTime @default(now())
  
  // ← NOVO
  tags        String[] @default([])
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}
```

```bash
npx prisma migrate dev --name "add_tags_to_transactions"
```

### Debugging Backend

**DevTools de Backend:**
```bash
cd backend
node --inspect-brk ./node_modules/.bin/tsx src/server.ts
# Chrome DevTools: chrome://inspect
```

**Logs no console:**
```typescript
// Qualquer arquivo do backend
console.log("Debug:", value);
// Aparece no Terminal 1
```

### Debugging Frontend

**DevTools do Browser:**
1. F12 no navegador
2. Abas: Console, Network, Elements
3. Breakpoints nos arquivos TypeScript

**Redux DevTools (se usar):**
- Instale extensão do navegador
- Monitore state changes em tempo real

### Testing

**Backend:**
```bash
cd backend
npm run test          # roda testes (se existirem)
```

**Frontend:**
```bash
cd frontend
npm run test          # roda testes (se existirem)
```

### Build para Produção

**Frontend:**
```bash
cd frontend
npm run build
# Gera pasta: dist/
# Pronto para upload em Vercel, Netlify, etc.
```

**Backend:**
```bash
cd backend
npm run build         # (se existir)
# Ou diretamente: node dist/server.js
```

---

## 🔄 Database Migrations

### Criar nova migração

```bash
cd backend

# 1. Edite schema.prisma
# 2. Execute prisma migrate
npx prisma migrate dev --name "descricao"

# 3. Commit
git add prisma/migrations
git commit -m "migration: descricao"
```

### Revert de migração

```bash
cd backend
npx prisma migrate resolve --rolled-back 20240101120000_migration_name
```

### Resestar banco (⚠️ DATA LOSS)

```bash
cd backend
npx prisma migrate reset
# ⚠️ Deleta TODOS os dados e reaplica todas as migrations
# Use apenas em desenvolvimento!
```

### Ver status das migrations

```bash
cd backend
npx prisma migrate status
```

---

## 📦 Ambiente de Staging/Produção

### Staging (Teste antes de produção)

Use as mesmas pastas, pero aponte para BD diferente:

```env
# backend/.env.staging
DATABASE_URL="postgresql://user:pass@staging-db:5432/fintrack-staging"
```

```bash
# Rode com env diferente
NODE_ENV=staging npm run dev
```

### Produção

**Backend:**
- Deploy em: Render, Railway, Fly.io, Google Cloud, AWS
- Use: `npm run build && node dist/server.js`
- Env: Production database URL

**Frontend:**
- Deploy em: Vercel, Netlify
- Use: `npm run build && deploy dist/`
- Env: Production API URL (ex: https://api.fintrack.com)

---

## ⚠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| Backend não inicia | `cd backend && npx prisma generate` |
| Frontend mostra erro CORS | Verifique `VITE_API_URL` em `.env` |
| "Port XXX already in use" | `taskkill /F /IM node.exe` (Windows) |
| Banco vazio/reset | `cd backend && npx prisma db seed` |
| Tipos TypeScript desatualizados | `cd backend && npx prisma generate` |
| Git merge conflicts em migrations | `npx prisma migrate resolve --rolled-back <name>` |

---

## 📋 Checklist Antes de Commit

- [ ] Backend rodando sem erros?
- [ ] Frontend carregando sem erros (F12 → Console)?
- [ ] Mudanças funcionam manualmente no navegador?
- [ ] Tipos TypeScript compilam?
- [ ] Adicionar + deletar um item testa CRUD?
- [ ] Logout + login testa autenticação?

Comando rápido:
```bash
cd backend && npm run dev &
cd frontend && npm run dev &
# Aguarde ambos iniciarem
# Teste manualmente no navegador
# Ctrl+C para parar ambos
```

---

## 🎓 Boas Práticas

### ✅ Fazer

1. **Manage state em um único lugar**
   - React Context para estado global
   - Custom hooks para lógica reutilizável

2. **API client centralizado**
   - Arquivo único `frontend/src/lib/api.ts`
   - Todas as calls HTTP passam por lá
   - Facilita mudança de URL, interceptors, logging

3. **Type-safety end-to-end**
   - Backend: Zod para validação
   - Frontend: TypeScript interfaces
   - Gerado automaticamente de `backend/prisma/schema.prisma`

4. **Commits atômicos**
   ```bash
   git add feature-completa
   git commit -m "feat: adicionar tal coisa"
   ```

5. **Branch por feature**
   ```bash
   git checkout -b feature/adicionar-categorias
   # ... trabalho ...
   git commit
   git push origin feature/adicionar-categorias
   # → PR no GitHub
   ```

### ❌ Evitar

1. **Misturar responsabilidades em uma rota**
   - Autenticação + Lógica + DB em uma função

2. **Magic strings**
   - Use constantes: `const API_BASE = process.env.VITE_API_URL`

3. **Dados duplicados entre memoria Browser e servidor**
   - Single source of truth: servidor é sempre correto

4. **Commits gigantes**
   - Um commit = uma feature/bugfix

5. **node_modules no Git**
   - `.gitignore` deve ter `node_modules/`

---

## 📚 Referências

- **Backend Docs:** `backend/README.md`
- **Frontend Docs:** `frontend/README.md`
- **API Endpoints:** `README.md` (raiz)
- **Root Cause:** `ROOT_CAUSE_ANALYSIS.md`
- **Testing Guide:** `TESTING_GUIDE.md`

---

## 🚀 Próximos Passos Recomendados

1. **Implementar Tests**
   - Backend: Jest + Supertest
   - Frontend: Vitest + React Testing Library

2. **Setup CI/CD**
   - GitHub Actions: Lint → Test → Build
   - Deploy automático no merge

3. **Melhorar Performance**
   - Code splitting no Frontend
   - Caching no Backend
   - Database indexes

4. **Escalabilidade**
   - Adicionar Redis para cache
   - Implementar request queuing
   - Database replication

---

**Última atualização:** Após removal de Electron  
**Status:** Padrão Recomendado para Desenvolvimento  
**Mantido por:** Team FinTrack
