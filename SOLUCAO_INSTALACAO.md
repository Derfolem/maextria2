# 🔧 SOLUÇÃO PARA INSTALAÇÃO DO BACKEND

## Problema Identificado

O `better-sqlite3` requer ferramentas de compilação C++ nativas do sistema.

## ✅ SOLUÇÃO RECOMENDADA

### Opção 1: Instalar Ferramentas de Build (RECOMENDADO)

Execute estes comandos para instalar as ferramentas necessárias:

```bash
# Instalar build essentials
sudo apt-get update
sudo apt-get install -y build-essential python3

# Depois instalar dependências do backend
cd /home/fredomi/maextria/backend
npm install
```

### Opção 2: Usar Banco de Dados Alternativo (Mais Simples)

Se não tiver permissões de sudo, vou criar uma versão com lowdb (banco JSON):

```bash
cd /home/fredomi/maextria/backend

# Remover better-sqlite3 e usar alternativa
npm uninstall better-sqlite3
npm install lowdb@6.1.1

# Depois precisaremos adaptar o código
```

### Opção 3: Usar Docker (Isolado)

```bash
# Criar Dockerfile no backend
# Executar tudo em container
```

## 🚀 SOLUÇÃO RÁPIDA PARA TESTAR AGORA

Execute este comando:

```bash
cd /home/fredomi/maextria/backend
sudo apt-get install -y build-essential && npm install
```

Se não tiver sudo, me avise que crio uma versão alternativa com lowdb!

## ⚡ Após Instalar

1. Build do backend:
```bash
cd /home/fredomi/maextria/backend
npm run build
```

2. Criar banco e seed:
```bash
node dist/database/seed.js
```

3. Iniciar:
```bash
# Terminal 1
cd /home/fredomi/maextria/backend
npm run dev

# Terminal 2  
cd /home/fredomi/maextria/frontend
npm run dev
```

4. Acessar: http://localhost:5173

---

**Qual opção você prefere?**
