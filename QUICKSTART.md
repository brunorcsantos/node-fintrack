# ⚡ Quick Start — Execute Agora

Se você quer começar a desenvolver **agora mesmo**, siga este guia ultra-rápido.

---

## 🚀 Em 5 Minutos

### 1. Limpe tudo (1 minuto)

```bash
# Windows
cd backend && rmdir /s /q node_modules & del package-lock.json
npm install
cd ..\frontend && rmdir /s /q node_modules & del package-lock.json
npm install
cd ..

# Mac/Linux
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
cd ..
```

### 2. Abra dois terminais (5 segundos)

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2 (novo):**
```bash
cd frontend
npm run dev
```

### 3. Acesse no navegador (10 segundos)

```
http://localhost:5173
```

---

## ✅ Você deve ver:

- **Terminal 1 (Backend)**: `Server listening at http://0.0.0.0:3333`
- **Terminal 2 (Frontend)**: `VITE ready in XXX ms ➜ Local: http://localhost:5173/`
- **Navegador**: Tela de login do FinTrack

---

## 🎮 Teste Isto:

1. **Register:** Clique em "Criar Conta" e crie uma conta
2. **Login:** Faça login com suas credenciais
3. **Dashboard:** Deve aparecer o dashboard com gráficos e saldo
4. **Create:** Clique em "Nova Transação" e crie uma
5. **Verify:** Transação deve aparecer na lista e no gráfico

---

## 🐛 Se algo der errado:

| Erro | Solução |
|------|---------|
| Backend não inicia | `cd backend && npx prisma generate` |
| Frontend mostra 500 | Verifique se Backend está rodando |
| "Port 3333 in use" | `taskkill /F /IM node.exe` (Windows) |
| Banco sem dados | Nenhum problema, crie dados testando |

---

## 📚 Ler Depois:

- `TESTING_GUIDE.md` — Validação completa (45 min)
- `DEVELOPMENT_WORKFLOW.md` — Como trabalhar no dia-a-dia
- `ROOT_CAUSE_ANALYSIS.md` — Entender o que deu errado antes
- `CLEANUP_COMPLETE.md` — Resumo de tudo o que foi feito

---

**Pronto! Você está desenvolvendo! ✨**
