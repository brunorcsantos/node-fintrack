# 📋 Guia de Testes Pós-Cleanup Electron

Após a remoção completa do Electron, siga este guia passo a passo para validar que tudo funciona corretamente.

---

## ✅ Pré-requisitos

- PostgreSQL rodando localmente
- Node.js 18+ instalado
- Dois terminais abertos

---

## 🧪 Fase 1: Validação da Estrutura (5 min)

### 1.1 Verifique a pasta desktop foi removida

```bash
# Windows
ls
# Resultado esperado: backend/, frontend/, node_modules/, package.json, README.md, .git, etc.
# ❌ NÃO DEVE haver pasta 'desktop'

# Mac/Linux
ls -la
```

### 1.2 Verifique que não há mais resquícios de Electron

```bash
# Windows - procure por "electron" no workspace
findstr /r "electron" *.md *.json
# Resultado esperado: Nenhuma menção a "electron" em arquivos raiz

# Mac/Linux
grep -r "electron" . --include="*.json" --include="*.md" 2>/dev/null | grep -v node_modules | grep -v ".git"
# Resultado esperado: Vazio
```

---

## 🚀 Fase 2: Setup Inicial (10 min)

### 2.1 Limpe node_modules e reinstale Backend

```bash
cd backend
rm -r node_modules package-lock.json     # Windows: usar rmdir /s /q node_modules
npm install
# Resultado esperado: ✔ added 000 packages
```

### 2.2 Limpe node_modules e reinstale Frontend

```bash
cd ../frontend
rm -r node_modules package-lock.json
npm install
# Resultado esperado: ✔ added 000 packages
```

### 2.3 Volte para raiz

```bash
cd ..
```

---

## 🧬 Fase 3: Testes de Backend (15 min)

### 3.1 Abra Terminal 1 e inicie o Backend

```bash
cd backend
npm run dev
```

**Resultado esperado:**
```
Server listening at http://0.0.0.0:3333
```

**Se der erro:**
```
Error: Post http://localhost:5432/: connection refused
→ PostgreSQL não está rodando. Inicie-o e tente novamente.

Error: ENOENT: ENOTDIR... query_engine
→ Rode: npx prisma generate
```

### 3.2 Teste health check em outra aba (sem fechar Terminal 1)

```bash
# PowerShell Windows
Invoke-WebRequest http://localhost:3333 -ErrorAction SilentlyContinue
# Resultado esperado: HTTP 404 (é normal, nenhuma rota GET /)

# Ou teste com curl (se instalado)
curl http://localhost:3333
```

### 3.3 Teste endpoint de registro

```bash
# PowerShell Windows
$body = @{
  email = "test@example.com"
  password = "Test123!@#"
  name = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3333/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Mac/Linux - use curl
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

**Resultado esperado:**
```json
{
  "ok": true,
  "user": { "id": "...", "email": "test@example.com", "name": "Test User" }
}
```

Or HTTP 400 if validation fails:
```json
{ "error": "User already exists" }
```

**Se der erro:**
```
Error: Connection refused
→ Backend não está rodando. Verifique Terminal 1.

Error: 500
→ Verificar logs no Terminal 1. Provavelmente JWT_SECRET/JWT_REFRESH_SECRET missing.
```

### 3.4 Teste endpoint de login

```bash
# PowerShell
$loginBody = @{
  email = "test@example.com"
  password = "Test123!@#"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3333/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

# Mac/Linux
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Resultado esperado:**
```json
{
  "accessToken": "eyJ0eXAi...",
  "refreshToken": "eyJ0eXAi...",
  "user": { "id": "...", "email": "test@example.com" }
}
```

**Se der erro:**
```
Invalid email or password (404)
→ User não existe ou credenciais incorretas

TypeError: Cannot read property 'accessToken'
→ Backend retornou resposta malformada. Verifique logs.
```

✅ **Backend OK se ambos testes passarem**

---

## 🎨 Fase 4: Testes de Frontend (10 min)

### 4.1 Abra Terminal 2 (mantenha Terminal 1 rodando)

```bash
cd frontend
npm run dev
```

**Resultado esperado:**
```
VITE ready in XXX ms

➜  Local:     http://localhost:5173/
➜  press h to show help
```

### 4.2 Acesse http://localhost:5173 no navegador

- ✅ **Deve mostrar a tela de Login/Registro**
- ✅ **DevTools (F12) → Console → Nenhum erro vermelho**
- ✅ **DevTools → Network → Requisições para http://localhost:3333**

### 4.3 Teste fluxo de Registro no Frontend

1. Clique em "Criar Conta" (ou similar)
2. Preencha:
   - Email: `frontend@test.com`
   - Senha: `Test123!@#`
   - Nome: `Frontend Tester`
3. Clique em "Registrar"

**Resultado esperado:**
```
✅ Conta criada com sucesso
→ Redirecionado para Dashboard
→ Mostra nome do usuário no Header
```

**Se der erro:**
```
❌ "Network request failed" ou "500"
→ Verifique Terminal 1 (backend) - há erro lá?
→ Verifique DevTools → Network → observe requisição POST /auth/register
→ Response deve ser 201 ou 400, nunca 500

❌ "Usuário já existe"
→ Normal se backend e frontend compartilham BD
→ Tente com email diferente
```

### 4.4 Teste fluxo de Login

1. Faça logout (se estiver logado)
2. Login com:
   - Email: `frontend@test.com`
   - Senha: `Test123!@#`

**Resultado esperado:**
```
✅ Login bem-sucedido
→ Redirecionado para Dashboard
→ Mostra saldo, receitas, despesas
```

✅ **Frontend OK se login funcionar**

---

## 🔗 Fase 5: Integração Backend ↔ Frontend (5 min)

### 5.1 Teste fluxo completo

Ambos terminais rodando:
- Terminal 1: Backend em http://localhost:3333
- Terminal 2: Frontend em http://localhost:5173

Com Frontend aberto no navegador:

1. **Registrar novo usuário**
   - Email: `integration@test.com`
   - Resultado esperado: ✅ Usuário criado no BD

2. **Fazer logout** (botão no header)
   - Resultado esperado: ✅ Redirecionado para tela de login

3. **Fazer login com credenciais**
   - Resultado esperado: ✅ Acesso ao Dashboard

4. **Criar uma transação** (via botão "Nova Transação")
   - Descrição: "Teste de integração"
   - Valor: 100.00
   - Categoria: qualquer
   - Resultado esperado: ✅ Transação aparece na lista

5. **Verificar persistência no BD**
   ```bash
   # Terminal 3 - PostgreSQL
   psql -U postgres -d fintrack -c "SELECT * FROM \"Transaction\" LIMIT 1;"
   # Resultado esperado: Mostra registro da transação criada
   ```

---

## 🎯 Fase 6: Validação de Ambiente (5 min)

### 6.1 Verifique variáveis de ambiente

**Backend (backend/.env):**
```bash
cat backend/.env
# Resultado esperado:
# DATABASE_URL=postgresql://postgres:...
# JWT_SECRET=sua-chave-secreta
# JWT_REFRESH_SECRET=sua-chave-refresh
# PORT=3333
```

**Frontend (frontend/.env):**
```bash
cat frontend/.env
# Resultado esperado:
# VITE_API_URL=http://localhost:3333
```

### 6.2 Verifique DevTools no Frontend

Abra DevTools (F12) → Console → Execute:

```javascript
// Verificar que API_URL está correto
console.log("API Base:", process.env.VITE_API_URL || "http://localhost:3333")

// Verificar que não há log de Electron
console.log("Window.electronAPI:", window.electronAPI)
// Resultado esperado: undefined (não deve ter Electron API)
```

---

## 🚀 Resumo de Sucesso

Se todos os testes passarem:

| Teste | Status |
|-------|--------|
| ✅ Pasta desktop removida | PASS |
| ✅ Sem referências a Electron | PASS |
| ✅ Backend sobe sem erros | PASS |
| ✅ CRUD /auth/register funciona | PASS |
| ✅ CRUD /auth/login funciona | PASS |
| ✅ Frontend carrega sem erros | PASS |
| ✅ Frontend conecta ao backend | PASS |
| ✅ Fluxo de autenticação completo | PASS |
| ✅ Criar transação persiste no BD | PASS |

**🎉 Projeto está pronto para desenvolvimento!**

---

## 🔧 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| `ENOENT: query_engine` | `cd backend && npx prisma generate` |
| `Port 3333 in use` | `netstat -ano \| findstr :3333` e matar processo |
| `Connection refused` | Verifique PostgreSQL: `psql postgres` |
| `Token malformed` | Verifique JWT_SECRET em .env |
| `CORS error` | Backend não está rodando ou URL incorreta |
| `Module not found` | `npm install` ou reinstale node_modules |

---

## 📝 Próximos Passos

Após validar tudo:

1. **Commit das mudanças:**
   ```bash
   git add .
   git commit -m "refactor: remove Electron, restructure as pure web app"
   ```

2. **Atualizar workflow de desenvolvimento:**
   - Sempre rodar Backend em Terminal 1
   - Sempre rodar Frontend em Terminal 2
   - Usar `npm run dev:backend` e `npm run dev:frontend` separadamente

3. **Documentar qualquer problema encontrado** neste guide

---

**Boa sorte! 🚀**
