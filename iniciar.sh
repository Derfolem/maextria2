#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║       🎓 MAEXTRIA - Plataforma de Cursos Online 🎓    ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script do diretório maextria/"
    exit 1
fi

echo "📦 Verificando dependências..."

# Backend
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

# Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Instalando dependências do frontend..."
    cd frontend && npm install && cd ..
fi

# Verificar .env
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Criando arquivo .env..."
    cp backend/.env.example backend/.env
    echo "⚠️ IMPORTANTE: Edite backend/.env com suas configurações!"
fi

# Verificar se banco existe
if [ ! -f "backend/database/maextria.db" ]; then
    echo "🗄️ Inicializando banco de dados..."
    cd backend
    npm run build
    node dist/database/seed.js
    cd ..
fi

echo ""
echo "✅ Tudo pronto!"
echo ""
echo "Para iniciar a aplicação, abra 2 terminais:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd /home/fredomi/maextria/backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd /home/fredomi/maextria/frontend"
echo "  npm run dev"
echo ""
echo "Depois acesse: http://localhost:5173"
echo ""
echo "Contas de teste:"
echo "  Credenciais demo: consulte backend/src/database/seed.ts"
echo "  Use somente contas locais fictícias"
echo "  Nao publique senhas em texto claro"
echo ""
