# 🔧 SOLUÇÃO TEMPORÁRIA - PROBLEMA COM PYTHON

## ❌ Problema
O node-gyp precisa de Python 3.8+ mas o sistema tem Python 3.7.3

## ✅ SOLUÇÃO RÁPIDA (3 opções)

### OPÇÃO 1: Atualizar Python (RECOMENDADO)

```bash
# Instalar Python 3.8+
sudo apt-get update
sudo apt-get install python3.8 python3.8-dev

# Configurar como padrão
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1

# Verificar
python3 --version

# Depois reinstalar
cd /home/fredomi/maextria/backend
npm rebuild better-sqlite3
```

### OPÇÃO 2: Usar binário pré-compilado

```bash
cd /home/fredomi/maextria/backend/node_modules/better-sqlite3
npx prebuild-install --runtime=node --target=22.21.0
```

### OPÇÃO 3: Download manual do binário

```bash
cd /home/fredomi/maextria/backend
mkdir -p node_modules/better-sqlite3/build/Release
cd node_modules/better-sqlite3/build/Release

# Baixar binário pré-compilado
wget https://github.com/WiseLibs/better-sqlite3/releases/download/v9.2.2/better-sqlite3-v9.2.2-node-v127-linux-x64.tar.gz

# Extrair
tar -xzf better-sqlite3-v9.2.2-node-v127-linux-x64.tar.gz

# Voltar e testar
cd /home/fredomi/maextria/backend
node dist/database/seed.js
```

## 🚀 DEPOIS DE RESOLVER

```bash
cd /home/fredomi/maextria/backend
npm run build
node dist/database/seed.js

# Iniciar
npm run dev
```

## 💡 QUAL ESCOLHER?

- **OPÇÃO 1**: Melhor solução permanente
- **OPÇÃO 2**: Mais rápida se funcionar
- **OPÇÃO 3**: Garantida de funcionar
