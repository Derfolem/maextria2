# 🎓 MAEXTRIA - Plataforma Completa de Cursos Online

## Estado do frontend (para manter clareza)

Frontend ativo (deploy Vercel / root directory): `frontend/`  
Frontend obsoleto (arquivado): `legacy/root-frontend/` (usa Supabase direto)

Se for mexer no site em producao, **use apenas** `frontend/`.

Uma plataforma moderna e completa de cursos online com **área de alunos, professores e administradores**, desenvolvida com **React, Node.js, TypeScript e SQLite**.

---

## 🚀 Características Principais

### ✨ Para Alunos
- 📚 **Navegação de cursos** - Explore cursos por categoria e dificuldade
- 🎯 **Matrícula gratuita** - Inscreva-se em cursos sem custo
- 📊 **Acompanhamento de progresso** - Veja seu avanço em cada curso
- 🎓 **Certificados pagos** - Obtenha certificados ao concluir cursos
- 💬 **Chat IA integrado** - Tire dúvidas com assistente inteligente

### 👨‍🏫 Para Professores
- ✏️ **Criar e gerenciar cursos** - Sistema completo de criação de conteúdo
- 📑 **Módulos e aulas** - Organize o conteúdo em módulos estruturados
- 🎥 **Vídeos e materiais** - Adicione links de vídeos e materiais para download
- 🖼️ **Geração de imagens com IA** - Crie capas profissionais usando IA
- 📈 **Dashboard de métricas** - Acompanhe receita, alunos e engajamento
- 💰 **Receita de certificados** - Ganhe com a venda de certificados

### 🔧 Para Administradores
- 👥 **Gestão de usuários** - Controle total sobre contas e permissões
- 🎓 **Gestão de cursos** - Publicar, despublicar e excluir cursos
- 💼 **Dashboard executivo** - Visão geral completa da plataforma
- 💵 **Configuração de lucros** - Defina a partilha de lucros com professores
- 📊 **Analytics completo** - Métricas de marketing e financeiras

---

## 📦 Instalação Rápida

### 1. Instalar Dependências

```bash
# Backend
cd maextria/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar Backend

```bash
cd maextria/backend
cp .env.example .env
# Edite o .env conforme necessário
```

### 3. Inicializar Banco de Dados

```bash
cd maextria/backend
npm run build
node dist/database/seed.js
```

### 4. Iniciar Aplicação

Terminal 1 (Backend):
```bash
cd maextria/backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd maextria/frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## 👤 Contas de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@maextria.com | senha123 |
| **Professor** | prof.maria@maextria.com | senha123 |
| **Aluno** | aluno1@example.com | senha123 |

---

## 🛠️ Tecnologias

**Backend:** Node.js, Express, TypeScript, SQLite, JWT, OpenAI  
**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, Recharts

---

## 📚 Documentação Completa

Veja o arquivo README completo em cada pasta (backend/frontend) para mais detalhes sobre:
- Estrutura do projeto
- Endpoints da API
- Componentes React
- Configurações avançadas

---

**Desenvolvido com ❤️ para educação de qualidade**
