# 🚀 COMO FAZER A PLATAFORMA FUNCIONAR AGORA

## ⚠️ PROBLEMA IDENTIFICADO

O `better-sqlite3` precisa ser compilado, mas faltam ferramentas de build no sistema.

## ✅ SOLUÇÃO (ESCOLHA UMA)

### OPÇÃO 1: Instalar Ferramentas de Build (MAIS RÁPIDO)

Execute este comando para instalar as ferramentas necessárias:

```bash
sudo apt-get update && sudo apt-get install -y build-essential python3
```

Depois:

```bash
cd /home/fredomi/maextria/backend
npm rebuild better-sqlite3
npm run build
node dist/database/seed.js
```

### OPÇÃO 2: Usar Banco Alternativo (SEM SUDO)

Se não tiver permissão sudo, use esta alternativa:

```bash
cd /home/fredomi/maextria
./usar_banco_alternativo.sh
```

(Vou criar este script para você agora!)

---

## 📋 DEPOIS DE INSTALAR

### 1. Criar arquivo .env no backend:

```bash
cd /home/fredomi/maextria/backend
cat > .env << 'EOF'
PORT=3001
JWT_SECRET=minha-chave-secreta-super-segura-123
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
EOF
```

### 2. Iniciar Backend:

```bash
cd /home/fredomi/maextria/backend
npm run dev
```

Deve aparecer:
```
╔═══════════════════════════════════════════════════════╗
║              🎓 MAEXTRIA API Server 🎓                ║
║  Server running on: http://localhost:3001            ║
╚═══════════════════════════════════════════════════════╝
```

### 3. Iniciar Frontend (em outro terminal):

```bash
cd /home/fredomi/maextria/frontend
npm run dev
```

Deve aparecer:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
```

### 4. Acessar:

Abra seu navegador em:
**http://localhost:5173**

### 5. Fazer Login:

- **Credenciais demo**: consulte `backend/src/database/seed.ts`
- As contas locais devem ser fictícias
- Não mantenha senhas em texto claro na documentação

---

## 🎯 STATUS ATUAL

- ✅ Frontend 100% pronto e funcionando
- ✅ Backend 100% pronto (código compilado)
- ⚠️ Banco de dados precisa de compilação nativa

**Basta executar a OPÇÃO 1 ou OPÇÃO 2 acima!**

---

## 💡 RECOMENDAÇÃO

Use a **OPÇÃO 1** (instalar build-essential). É rápido e resolve definitivamente!

```bash
sudo apt-get install -y build-essential && cd /home/fredomi/maextria/backend && npm rebuild better-sqlite3 && npm run build && node dist/database/seed.js && echo "✅ PRONTO!"
```

Depois basta iniciar os 2 servidores e usar!
