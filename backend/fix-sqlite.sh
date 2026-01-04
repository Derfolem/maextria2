#!/bin/bash

echo "🔧 Corrigindo better-sqlite3..."

cd /home/fredomi/maextria/backend

# Criar diretório para o binário
mkdir -p node_modules/better-sqlite3/build/Release

# Baixar binário pré-compilado para Node v22 (v127)
echo "📥 Baixando binário pré-compilado..."
curl -L "https://github.com/WiseLibs/better-sqlite3/releases/download/v9.2.2/better-sqlite3-v9.2.2-node-v127-linux-x64.tar.gz" -o /tmp/better-sqlite3.tar.gz

# Extrair
echo "📦 Extraindo..."
tar -xzf /tmp/better-sqlite3.tar.gz -C node_modules/better-sqlite3/build/Release/

# Testar
echo "🧪 Testando..."
node -e "const db = require('better-sqlite3')(':memory:'); console.log('✅ SQLite funcionando!');"

if [ $? -eq 0 ]; then
    echo "✅ better-sqlite3 instalado com sucesso!"
    echo ""
    echo "Agora execute:"
    echo "  npm run build"
    echo "  node dist/database/seed.js"
else
    echo "❌ Erro ao testar. Tente a opção manual."
fi
