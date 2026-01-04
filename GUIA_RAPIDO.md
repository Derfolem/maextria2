# 🚀 GUIA RÁPIDO - MAEXTRIA

## ⚡ Início Rápido (5 minutos)

### Passo 1: Instalar Dependências
```bash
cd /home/fredomi/maextria/backend && npm install
cd /home/fredomi/maextria/frontend && npm install
```

### Passo 2: Configurar Backend
```bash
cd /home/fredomi/maextria/backend
cp .env.example .env
```

Edite o `.env` (mínimo necessário):
```env
PORT=3001
JWT_SECRET=minha-chave-secreta-123
FRONTEND_URL=http://localhost:5173
```

### Passo 3: Criar Banco de Dados
```bash
cd /home/fredomi/maextria/backend
npm run build
node dist/database/seed.js
```

### Passo 4: Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd /home/fredomi/maextria/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/fredomi/maextria/frontend
npm run dev
```

### Passo 5: Acessar
Abra: **http://localhost:5173**

---

## 🔐 Login de Teste

- **Admin:** admin@maextria.com / senha123
- **Professor:** prof.maria@maextria.com / senha123
- **Aluno:** aluno1@example.com / senha123

---

## ✅ Funcionalidades Principais

### Como Aluno:
1. Explore cursos em "Cursos"
2. Clique em "Matricular-se"
3. Acesse "Meus Cursos" no menu
4. Assista aulas e marque como concluídas
5. Ao completar 100%, solicite certificado

### Como Professor:
1. Acesse "Meus Cursos"
2. Clique em "Criar Novo Curso"
3. Preencha informações básicas
4. Adicione módulos e aulas
5. Publique o curso

### Como Admin:
1. Acesse "Dashboard Admin"
2. Gerencie usuários em "Usuários"
3. Controle cursos em "Cursos"
4. Configure lucros em "Configurações"

---

## 🐛 Problemas Comuns

**Erro ao conectar backend:**
- Verifique se está rodando na porta 3001
- Confira o arquivo .env

**Erro no frontend:**
- Limpe cache: `rm -rf node_modules && npm install`
- Verifique se backend está rodando

**Banco de dados vazio:**
- Execute novamente: `node dist/database/seed.js`

---

## 📞 Estrutura de Pastas

```
maextria/
├── backend/          # API Node.js
│   ├── src/
│   ├── database/     # SQLite DB
│   └── .env          # Configurações
├── frontend/         # React App
│   └── src/
└── README.md
```

---

**Pronto! A plataforma está funcionando! 🎉**
