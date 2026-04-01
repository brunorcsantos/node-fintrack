Guia Detalhado - Próximos Passos
Fase 1: Preparar Migrations SQLite
Passo 1.1: Criar pasta de migrations para SQLite
Das migrations PostgreSQL, você pode copiar a estrutura inicial. Mas primeiro, preciso verificar se as migrations existem:

Você verá um arquivo migration.sql. Esse arquivo contém os comandos SQL para PostgreSQL. Para SQLite, precisamos gerar novos.

Passo 1.2: Criar diretório de migrations para SQLite
Passo 1.3: Gerar a primeira migration SQLite
Isso prepara o Prisma Client para trabalhar com SQLite.

Fase 2: Testar o Electron com SQLite
Passo 2.1: Limpar Node Modules e Dependências (opcional, se houver conflitos)
Passo 2.2: Testar inicialização do Electron
Execute o comando na raiz do projeto:

Isso deve:

Abrir 2 terminais em paralelo (Vite + Electron)
Compilar frontend (porta 5173)
Iniciar Electron com backend (porta 3333)
Gerar Prisma Client para SQLite automaticamente
Criar banco SQLite em %APPDATA%/FinTrack/data/fintrack.db
Observar os logs:

Passo 2.3: Se aparecer erro de validação Prisma
Erro esperado:

Solução: O backend precisa criar as tabelas. Execute na pasta backend:

Ou se usar dev mode:

Fase 3: Criar Primeira Migration SQLite (Correta)
Passo 3.1: Criar migration inicial usando db push
O que faz:

Síncrona o schema com o banco SQLite
Cria todas as tabelas
Sem usar migrations (rápido para dev)
Passo 3.2: Se preferir usar migrations (para produção)
Isso cria:

prisma/migrations_sqlite/20260330_init_sqlite/migration.sql
Fase 4: Testar Funcionalidades Básicas
Passo 4.1: Abrir a janela Electron
Quando rodar npm run dev, você verá:

A janela deve carregar a UI do frontend em http://localhost:5173.

Passo 4.2: Testar login/registro
Abrir DevTools (F12 quando a janela abrir)
Network tab → ver requisições ao backend
Tentar registrar novo usuário
Email: teste@test.com
Senha: senha123
Verificar se cria no SQLite
Passo 4.3: Verificar banco SQLite
Abre em http://localhost:5555 mostrando:

Tabela User com seu novo registro
Outras tabelas vazias
Fase 5: Resolver Problemas Comuns
❌ Problema: "Prisma Client generation failed"
Causa: Schema SQLite tem erro de sintaxe

Solução:

Mostra exatamente qual linha tem problema.

❌ Problema: "Database connection error"
Causa: Caminho do banco inválido ou permissões

Solução:

❌ Problema: Frontend carrega em branco
Causa: Vite não está rodando ou backend não respondeu a tempo

Solução:

❌ Problema: Porta 3333 já está em uso
Causa: Processo anterior não foi morto

Solução:

Fase 6: Build para Produção (Opcional)
Quando estiver tudo funcionando:

Passo 6.1: Build do frontend
Gera pasta dist com UI compilada.

Passo 6.2: Copiar para Electron
Copia dist para renderer.

Passo 6.3: Build do instalador
Gera FinTrack-1.0.0.exe com tudo embutido (frontend + backend + dados).

Checklist de Execução
Siga nesta ordem:

 Passo 1 - Criar migrations SQLite

 Passo 2 - Testar Electron

 Passo 3 - Criar tabelas SQLite

 Passo 4 - Abrir DevTools (F12) e testar login

 Passo 5 - Verificar Prisma Studio

 Passo 6 (opcional) - Build para produção

Sinais de Sucesso
✅ Electron abre janela com UI do frontend
✅ Consegue fazer login/registro
✅ Dados aparecem no Prisma Studio
✅ DevTools mostra requisições ao backend (200 OK)
✅ Nem um erro de "database connection" nos logs