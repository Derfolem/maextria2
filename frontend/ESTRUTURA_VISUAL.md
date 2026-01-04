# Estrutura Visual do Frontend MAEXTRIA

```
/home/fredomi/maextria/frontend/
│
├── 📄 package.json              (Dependências)
├── 📄 vite.config.ts           (Configuração Vite)
├── 📄 tailwind.config.js       (Configuração Tailwind)
├── 📄 tsconfig.json            (Configuração TypeScript)
├── 📄 index.html               (HTML principal)
│
├── 📄 README.md                (Documentação completa)
├── 📄 QUICKSTART.md            (Guia rápido)
├── 📄 FILES_CREATED.md         (Lista de arquivos)
├── 📄 IMPLEMENTACAO_COMPLETA.md (Resumo da implementação)
├── 📄 .env.example             (Exemplo de variáveis)
├── 🔧 check-files.sh           (Script de verificação)
│
└── 📁 src/
    │
    ├── 🎯 main.tsx             (Entry Point)
    ├── 🎯 App.tsx              (Router Principal)
    ├── 🎨 index.css            (Estilos Globais)
    │
    ├── 📁 lib/
    │   ├── api.ts              (Cliente Axios)
    │   └── store.ts            (Zustand Store)
    │
    ├── 📁 types/
    │   └── index.ts            (TypeScript Interfaces)
    │
    ├── 📁 components/
    │   ├── Layout.tsx          (Layout + Navbar)
    │   └── AIChat.tsx          (Chat IA Flutuante)
    │
    └── 📁 pages/
        │
        ├── Home.tsx            (Landing Page) 🏠
        ├── Login.tsx           (Login) 🔐
        ├── Register.tsx        (Registro) ✍️
        ├── Courses.tsx         (Listagem) 📚
        ├── CourseDetail.tsx    (Detalhes) 📖
        ├── Settings.tsx        (Configurações) ⚙️
        │
        ├── 📁 student/
        │   ├── Dashboard.tsx   (Dashboard Aluno) 📊
        │   ├── MyCourses.tsx   (Meus Cursos) 📚
        │   └── CoursePlayer.tsx (Player) ▶️
        │
        ├── 📁 teacher/
        │   ├── Dashboard.tsx   (Dashboard Professor) 📊
        │   ├── MyCourses.tsx   (Gerenciar) 📚
        │   └── CourseEditor.tsx (Editor) ✏️
        │
        └── 📁 admin/
            ├── Dashboard.tsx   (Dashboard Admin) 📊
            ├── Users.tsx       (Gestão Usuários) 👥
            ├── Courses.tsx     (Gestão Cursos) 📚
            └── Settings.tsx    (Configurações) ⚙️
```

## Fluxo de Navegação

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│              (Landing Page com Gradiente)                    │
│         [Explorar Cursos]  [Começar Agora]                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─► LOGIN ──► Autenticação ──┬─► STUDENT AREA
                 │                             │   ├─ Dashboard
                 │                             │   ├─ My Courses
                 │                             │   └─ Course Player
                 │                             │
                 │                             ├─► TEACHER AREA
                 │                             │   ├─ Dashboard
                 │                             │   ├─ My Courses
                 │                             │   └─ Course Editor
                 │                             │
                 │                             └─► ADMIN AREA
                 │                                 ├─ Dashboard
                 │                                 ├─ Users
                 │                                 ├─ Courses
                 │                                 └─ Settings
                 │
                 └─► REGISTER ──► Escolher Role
                                  ├─ Student
                                  └─ Teacher
```

## Mapa de Rotas

### Públicas (Sem Autenticação)
```
/                    → Home (Landing Page)
/login              → Login
/register           → Register
/courses            → Explorar Cursos
/courses/:id        → Detalhes do Curso
```

### Aluno (Role: student)
```
/student/dashboard      → Dashboard com estatísticas
/student/my-courses     → Lista de cursos matriculados
/student/course/:id     → Player do curso
/settings              → Configurações de conta
```

### Professor (Role: teacher)
```
/teacher/dashboard         → Dashboard com métricas
/teacher/my-courses        → Gerenciar cursos
/teacher/course/new        → Criar novo curso
/teacher/course/:id/edit   → Editar curso
/settings                 → Configurações de conta
```

### Admin (Role: admin)
```
/admin/dashboard    → Dashboard administrativo
/admin/users        → Gestão de usuários
/admin/courses      → Gestão de cursos
/admin/settings     → Configurações do sistema
/settings          → Configurações de conta
```

## Componentes Principais

### Layout.tsx
```
┌──────────────────────────────────────────────┐
│  🎓 MAEXTRIA    [Cursos] [Dashboard] [Sair] │ ← Navbar
├──────────────────────────────────────────────┤
│                                               │
│           Conteúdo da Página                 │
│                                               │
├──────────────────────────────────────────────┤
│      © 2024 MAEXTRIA. Todos os direitos      │ ← Footer
└──────────────────────────────────────────────┘
                                   🤖 ← Chat IA Flutuante
```

### Dashboard (Student/Teacher/Admin)
```
┌──────────────────────────────────────────────┐
│  Dashboard                    [Novo Curso]   │
├─────┬─────┬─────┬─────┐                     │
│ 📚  │ 👥  │ 💰  │ 📈  │  ← Cards Estatísticas│
│Cursos│Alunos│Receita│Matriculas│             │
├──────────────────┬──────────────────────────┤
│   📊 Gráfico    │  📋 Atividades Recentes  │
│   (Recharts)    │                          │
└──────────────────┴──────────────────────────┘
```

### Course Editor
```
┌──────────────────────────────────────────────┐
│  Editar Curso                    [💾 Salvar] │
├──────────────────────────────────────────────┤
│  📝 Informações Básicas                      │
│  ├─ Título                                   │
│  ├─ Descrição                                │
│  ├─ Preço                                    │
│  └─ Categoria                                │
├──────────────────────────────────────────────┤
│  📚 Módulos e Aulas            [+ Módulo]    │
│  ├─ 📂 Módulo 1                [🗑️]          │
│  │   ├─ 📄 Aula 1              [🗑️]          │
│  │   │   ├─ Vídeo URL                        │
│  │   │   ├─ Conteúdo                         │
│  │   │   └─ 📎 Materiais       [+ Material]  │
│  │   └─ 📄 Aula 2              [🗑️]          │
│  └─ 📂 Módulo 2                [🗑️]          │
└──────────────────────────────────────────────┘
```

### Course Player
```
┌──────────────────────────────────────────┬───┐
│                                          │ 📚 │
│          🎬 Vídeo Player                 │ M │
│                                          │ O │
│                                          │ D │
├──────────────────────────────────────────┤ U │
│  Aula 1: Introdução                      │ L │
│  📝 Conteúdo da aula...                  │ O │
│                                          │ S │
│  📎 Materiais:                           │   │
│  ├─ PDF - Slides.pdf                     │ ✅ │
│  └─ Link - Documentação                  │ ✅ │
│                                          │ ⭕ │
│  [Marcar como Concluída]                 │ ⭕ │
└──────────────────────────────────────────┴───┘
```

### Chat IA
```
                    ┌────────────────────┐
                    │ 🤖 Assistente IA  ✖│
                    ├────────────────────┤
                    │ Olá! Como posso    │
                    │ ajudar?            │
                    │                    │
                    │      Posso tirar   │
                    │      dúvidas sobre │
                    │      cursos?       │
                    │                    │
                    │ Claro! Qual curso  │
                    │ te interessa?      │
                    ├────────────────────┤
                    │ [Digite...]     📤 │
                    └────────────────────┘
```

## Cores e Tema

### Paleta Principal
```
Roxo Claro:    #667eea  ████████
Roxo Médio:    #764ba2  ████████
Roxo Escuro:   #5b21b6  ████████
Verde:         #10b981  ████████
Azul:          #3b82f6  ████████
Laranja:       #f97316  ████████
Vermelho:      #ef4444  ████████
```

### Gradientes
```
Hero:      linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Button:    linear-gradient(to right, #667eea, #764ba2)
Text:      background-clip: text (gradiente)
```

## Estado de Loading
```
┌──────────────────────────────────────────┐
│  ████░░░░░░░░░░  Carregando...          │
│                                          │
│  ████████████░░  80%                     │
│                                          │
│  ████████████████  Concluído!            │
└──────────────────────────────────────────┘
```

## Responsividade

### Desktop (>768px)
```
[Navbar Completa com todos os links]
[Grid 4 colunas para cards]
[Sidebar + Conteúdo Principal]
```

### Tablet (768px)
```
[Navbar com menu dropdown]
[Grid 2 colunas]
[Stack vertical]
```

### Mobile (<640px)
```
[Navbar hamburger]
[Grid 1 coluna]
[Cards full width]
[Menu bottom]
```

---

**Total: 24 arquivos TypeScript/React + 5 arquivos de documentação**
**Status: ✅ 100% COMPLETO**
