# Guia de Início Rápido - MAEXTRIA Frontend

## 1. Instalação

```bash
cd /home/fredomi/maextria/frontend
npm install
```

## 2. Verificar Backend

Certifique-se de que o backend está rodando em `http://localhost:3001`:

```bash
curl http://localhost:3001/api/health
```

## 3. Iniciar o Frontend

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 4. Usuários de Teste

Use estes usuários para testar (se criados no backend):

### Admin
- Email: `admin.demo@maextria.local`
- Senha: `admin123`
- Acesso: Dashboard administrativo completo

### Professor
- Email: `teacher.demo@maextria.local`
- Senha: `prof123`
- Acesso: Criar e gerenciar cursos

### Aluno
- Email: `student.demo@example.local`
- Senha: `aluno123`
- Acesso: Matricular-se e assistir cursos

## 5. Fluxo de Teste Completo

### Como Professor:
1. Faça login como professor
2. Acesse "Dashboard" para ver estatísticas
3. Clique em "Novo Curso" ou vá para "Meus Cursos"
4. Crie um novo curso com título, descrição e preço
5. Após salvar, adicione módulos
6. Adicione aulas aos módulos com vídeos e conteúdo
7. Publique o curso

### Como Aluno:
1. Faça login como aluno (ou crie uma conta)
2. Navegue para "Cursos"
3. Clique em um curso para ver detalhes
4. Clique em "Inscrever-se Agora"
5. Acesse "Meus Cursos"
6. Clique em "Continuar" no curso
7. Assista às aulas e marque como concluídas
8. Ao concluir 100%, gere o certificado

### Como Admin:
1. Faça login como admin
2. Acesse "Dashboard" para visão geral
3. Gerencie usuários em "Usuários"
4. Gerencie cursos em "Cursos"
5. Configure profit share em "Configurações"

## 6. Testar Chat IA

1. Em qualquer página, clique no botão roxo flutuante no canto inferior direito
2. Digite uma pergunta sobre a plataforma ou cursos
3. Veja a resposta da IA

## 7. Páginas Disponíveis

### Públicas (sem login):
- `/` - Home (landing page)
- `/login` - Login
- `/register` - Cadastro
- `/courses` - Explorar cursos
- `/courses/:id` - Detalhes do curso

### Aluno (requer login como student):
- `/student/dashboard` - Dashboard com estatísticas
- `/student/my-courses` - Meus cursos matriculados
- `/student/course/:id` - Player do curso

### Professor (requer login como teacher):
- `/teacher/dashboard` - Dashboard do professor
- `/teacher/my-courses` - Gerenciar meus cursos
- `/teacher/course/new` - Criar novo curso
- `/teacher/course/:id/edit` - Editar curso

### Admin (requer login como admin):
- `/admin/dashboard` - Dashboard administrativo
- `/admin/users` - Gestão de usuários
- `/admin/courses` - Gestão de cursos
- `/admin/settings` - Configurações do sistema

### Compartilhadas (qualquer usuário logado):
- `/settings` - Configurações da conta

## 8. Recursos Principais

- **Autenticação JWT** - Login seguro com tokens
- **Proteção de Rotas** - Acesso baseado em roles
- **Chat IA** - Assistente virtual em todas as páginas
- **Dashboard Interativo** - Gráficos com Recharts
- **Editor de Cursos** - CRUD completo de cursos/módulos/aulas
- **Player de Vídeo** - Suporte a YouTube, Vimeo, etc.
- **Sistema de Progresso** - Acompanhamento de aulas
- **Certificados** - Geração ao completar cursos
- **Design Responsivo** - Mobile-first com TailwindCSS
- **Notificações** - Toast notifications

## 9. Solução de Problemas

### Backend não está respondendo:
```bash
# Verifique se o backend está rodando
curl http://localhost:3001/api/health

# Se não estiver, inicie o backend
cd /home/fredomi/maextria/backend
npm run dev
```

### Erro 401 (Unauthorized):
- Token expirado ou inválido
- Faça logout e login novamente

### Erro de CORS:
- Verifique se o backend permite requisições de `http://localhost:5173`
- Verifique o arquivo `vite.config.ts` tem o proxy configurado

### Dependências faltando:
```bash
npm install
```

### Cache do navegador:
- Limpe o cache (Ctrl+Shift+Del)
- Ou use modo anônimo

## 10. Build de Produção

```bash
# Gerar build otimizado
npm run build

# Testar build localmente
npm run preview
```

Os arquivos de produção estarão em `/home/fredomi/maextria/frontend/dist`

## 11. Próximos Passos

1. Teste todas as funcionalidades
2. Customize cores e design se necessário
3. Configure variáveis de ambiente para produção
4. Implante em serviço de hosting (Vercel, Netlify, etc.)
5. Configure domínio personalizado

## Suporte

Para problemas ou dúvidas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do terminal
3. Confirme que backend e frontend estão na mesma versão
