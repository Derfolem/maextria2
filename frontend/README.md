# MAEXTRIA - Frontend

## Status

Este e o frontend ativo em producao (Vercel root directory = `frontend/`).  
O frontend antigo foi arquivado em `legacy/root-frontend/` e esta obsoleto.

Frontend completo da plataforma MAEXTRIA de cursos online desenvolvido com React, TypeScript e TailwindCSS.

## Tecnologias Utilizadas

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Zustand** - State management
- **Axios** - Cliente HTTP
- **TailwindCSS** - Framework CSS
- **Recharts** - Gráficos e visualizações
- **React Icons** - Ícones
- **React Hot Toast** - Notificações
- **Framer Motion** - Animações

## Estrutura de Diretórios

```
src/
├── lib/
│   ├── api.ts           # Cliente axios configurado
│   └── store.ts         # Zustand store (auth)
├── types/
│   └── index.ts         # TypeScript interfaces
├── components/
│   ├── Layout.tsx       # Layout principal com navbar
│   └── AIChat.tsx       # Chat AI flutuante
├── pages/
│   ├── Home.tsx         # Landing page
│   ├── Login.tsx        # Página de login
│   ├── Register.tsx     # Página de registro
│   ├── Courses.tsx      # Listagem de cursos
│   ├── CourseDetail.tsx # Detalhes do curso
│   ├── Settings.tsx     # Configurações de conta
│   ├── student/
│   │   ├── Dashboard.tsx      # Dashboard do aluno
│   │   ├── MyCourses.tsx      # Meus cursos (aluno)
│   │   └── CoursePlayer.tsx   # Player de curso
│   ├── teacher/
│   │   ├── Dashboard.tsx      # Dashboard do professor
│   │   ├── MyCourses.tsx      # Gerenciar cursos
│   │   └── CourseEditor.tsx   # Editor de curso
│   └── admin/
│       ├── Dashboard.tsx      # Dashboard admin
│       ├── Users.tsx          # Gestão de usuários
│       ├── Courses.tsx        # Gestão de cursos
│       └── Settings.tsx       # Configurações do sistema
├── App.tsx              # Router principal
├── main.tsx            # Entry point
└── index.css           # Estilos globais

```

## Funcionalidades Implementadas

### Autenticação
- Login e registro de usuários
- Gestão de sessão com Zustand
- Proteção de rotas por role

### Área do Aluno
- Dashboard com estatísticas e gráficos
- Listagem de cursos matriculados
- Player de curso com progresso
- Sistema de acompanhamento de aulas
- Geração de certificados

### Área do Professor
- Dashboard com métricas de desempenho
- Criação e edição de cursos
- Gerenciamento de módulos e aulas
- Upload de materiais didáticos
- Publicação/despublicação de cursos

### Área do Administrador
- Dashboard com visão geral da plataforma
- Gestão de usuários (CRUD)
- Gestão de cursos (publicação, exclusão)
- Configurações de profit share

### Recursos Gerais
- Chat AI integrado em todas as páginas
- Design responsivo
- Tema roxo/violeta (#667eea to #764ba2)
- Notificações toast
- Animações suaves

## Como Executar

### Instalação
```bash
cd /home/fredomi/maextria/frontend
npm install
```

### Desenvolvimento
```bash
npm run dev
```
O frontend estará disponível em `http://localhost:5173`

### Build de Produção
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## Variáveis de Ambiente

O frontend está configurado para conectar com o backend em `http://localhost:3001/api`.

Para alterar, edite o arquivo `/home/fredomi/maextria/frontend/src/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  // ...
});
```

## Rotas da Aplicação

### Públicas
- `/` - Home
- `/login` - Login
- `/register` - Registro
- `/courses` - Listagem de cursos
- `/courses/:id` - Detalhes do curso

### Aluno (student)
- `/student/dashboard` - Dashboard
- `/student/my-courses` - Meus cursos
- `/student/course/:id` - Player de curso

### Professor (teacher)
- `/teacher/dashboard` - Dashboard
- `/teacher/my-courses` - Gerenciar cursos
- `/teacher/course/new` - Criar curso
- `/teacher/course/:id/edit` - Editar curso

### Admin
- `/admin/dashboard` - Dashboard
- `/admin/users` - Gestão de usuários
- `/admin/courses` - Gestão de cursos
- `/admin/settings` - Configurações do sistema

### Compartilhadas (autenticadas)
- `/settings` - Configurações da conta

## Integração com Backend

O frontend está totalmente integrado com o backend MAEXTRIA rodando em `http://localhost:3001/api`.

Todas as rotas da API são consumidas através do cliente axios configurado em `src/lib/api.ts`.

## Design

O design utiliza o TailwindCSS com cores personalizadas:
- Gradiente principal: `#667eea` → `#764ba2` (roxo/violeta)
- Componentes reutilizáveis definidos em `index.css`
- Responsivo mobile-first
- Animações com Framer Motion

## Observações Importantes

1. **CourseEditor**: Ao publicar/despublicar cursos, usa apenas `is_published: true/false` sem serializar objetos completos
2. **Autenticação**: Token JWT armazenado no localStorage
3. **Interceptor Axios**: Automaticamente adiciona o token em todas as requisições
4. **Chat AI**: Componente flutuante disponível em todas as páginas
5. **Proteção de Rotas**: Componente `ProtectedRoute` valida autenticação e roles

## Próximos Passos

Para colocar em produção:
1. Configurar variáveis de ambiente para a URL da API
2. Configurar build otimizado
3. Implementar cache de imagens
4. Adicionar analytics
5. Implementar service worker para PWA
