# 📝 Guia: Criar Cursos em Markdown

## 🎯 Por que Markdown é Melhor?

✅ **Mais simples** que JSON
✅ **Mais legível** para humanos
✅ **ChatGPT gera melhor** neste formato
✅ **Mais fácil** de editar

---

## 📋 Formato do Arquivo .md

### **Estrutura Completa:**

```markdown
Título do Curso: Nome do Curso Aqui
Descrição do Curso: Descrição breve e atrativa do curso
Categoria: Nome da Categoria
Nível: Iniciante
Preço: 49.90

## Módulo 1: Título do Primeiro Módulo
Descrição do Módulo: O que o aluno aprenderá neste módulo

### Aula 1: Título da Primeira Aula
Conteúdo da Aula: Conteúdo completo da aula em markdown.

Pode usar:
- **Negrito**
- *Itálico*
- Listas
- Código: `exemplo`

### Aula 2: Título da Segunda Aula
Conteúdo da Aula: Mais conteúdo aqui...

## Módulo 2: Título do Segundo Módulo
Descrição do Módulo: Mais aprendizado...

### Aula 1: Outra Aula
Conteúdo da Aula: Continue criando aulas...
```

---

## 🔑 Campos Obrigatórios

| Campo | Formato | Exemplo | Notas |
|-------|---------|---------|-------|
| **Título do Curso** | Texto | `Python para Iniciantes` | Nome do curso |
| **Descrição do Curso** | Texto | `Aprenda Python do zero...` | Descrição breve |
| **Categoria** | Texto | `Programação` | Nome da categoria |
| **Nível** | Texto | `Iniciante` / `Intermediário` / `Avançado` | Dificuldade |
| **Preço** | Número | `49.90` | Preço do certificado |
| **## Módulo X:** | Título | `## Módulo 1: Introdução` | Começa com `##` |
| **Descrição do Módulo** | Texto | `Aprenda os conceitos básicos` | O que será ensinado |
| **### Aula X:** | Título | `### Aula 1: Primeiro Passo` | Começa com `###` |
| **Conteúdo da Aula** | Markdown | Texto formatado | Conteúdo completo |

---

## 📝 Formatação do Conteúdo

Dentro de "Conteúdo da Aula:", você pode usar:

### **Texto Simples**
```
Conteúdo da Aula: Este é um parágrafo simples.
```

### **Negrito e Itálico**
```
Conteúdo da Aula: Texto com **negrito** e *itálico*.
```

### **Listas**
```
Conteúdo da Aula: Aprenda:
- Primeiro item
- Segundo item
- Terceiro item
```

### **Código Inline**
```
Conteúdo da Aula: Use o comando `print("Hello")` em Python.
```

### **Blocos de Código**
```
Conteúdo da Aula: Exemplo de código:

```python
def hello():
    print("Hello, World!")
```
```

### **Subtítulos**
```
Conteúdo da Aula: Conceitos importantes

## Subtítulo 2
Texto aqui

### Subtítulo 3
Mais texto
```

---

## 🤖 Prompt para ChatGPT

Use este prompt otimizado:

```
Crie um curso completo sobre [TEMA] no formato Markdown estruturado.

FORMATO EXATO:

Título do Curso: [título do curso]
Descrição do Curso: [descrição breve e atrativa]
Categoria: [categoria]
Nível: Iniciante | Intermediário | Avançado
Preço: [valor com 2 casas decimais, ex: 49.90]

## Módulo 1: [título do módulo]
Descrição do Módulo: [o que será aprendido]

### Aula 1: [título da aula]
Conteúdo da Aula: [conteúdo completo com explicações, exemplos, listas, código se aplicável]

### Aula 2: [título da aula]
Conteúdo da Aula: [conteúdo completo...]

## Módulo 2: [título do módulo]
Descrição do Módulo: [o que será aprendido]

### Aula 1: [título da aula]
Conteúdo da Aula: [conteúdo completo...]

REQUISITOS:
- 3 a 5 módulos por curso
- 3 a 7 aulas por módulo
- Conteúdo rico e detalhado em cada aula
- Use markdown: negrito, listas, código quando relevante
- Seja prático e objetivo
- Foco em aplicação real

TEMA: [seu tema aqui]
PÚBLICO-ALVO: [profissionais de X, iniciantes em Y, etc]
```

---

## 🔄 Fluxo de Trabalho Completo

### **1️⃣ Pedir ao ChatGPT**
Use o prompt acima modificando o TEMA e PÚBLICO-ALVO.

### **2️⃣ Salvar o .md**
```bash
cd /home/fredomi/maextria/bulk-imports/courses
nano meu-curso.md
# Cole o conteúdo
# Ctrl+O, Enter, Ctrl+X
```

### **3️⃣ Repetir para vários cursos**
Crie quantos arquivos .md quiser:
- curso-python.md
- curso-excel.md
- curso-react.md
- etc.

### **4️⃣ Converter MD → JSON**
```bash
cd /home/fredomi/maextria/bulk-imports
node md-to-json.js
```

### **5️⃣ Combinar Todos**
```bash
node combine.js
```

### **6️⃣ Importar**
```bash
export ADMIN_TOKEN='seu-token'
./import.sh
```

---

## 📊 Exemplo Prático

Ver arquivo: `courses/exemplo-python.md`

---

## ⚠️ Erros Comuns

### ❌ **Erro: "Título do Curso não encontrado"**
**Solução:** Certifique-se que a primeira linha é:
```
Título do Curso: Nome Aqui
```

### ❌ **Erro: "Nenhum módulo encontrado"**
**Solução:** Os módulos devem começar com `##`:
```
## Módulo 1: Nome do Módulo
```

### ❌ **Erro: "Nível inválido"**
**Solução:** Use apenas:
- `Iniciante` ou `beginner` ou `Básico`
- `Intermediário` ou `intermediate` ou `Médio`
- `Avançado` ou `advanced`

### ❌ **Erro: "Preço inválido"**
**Solução:** Use formato numérico:
```
Preço: 49.90
```
Não use: `R$ 49,90` ou `49,90 reais`

---

## 💡 Dicas

### **Organização de Arquivos**
```
courses/
├── programacao-python-basico.md
├── programacao-python-avancado.md
├── excel-iniciante.md
├── excel-avancado.md
└── marketing-digital.md
```

### **Nomear Arquivos**
Use nomes descritivos e sem espaços:
- ✅ `python-para-iniciantes.md`
- ✅ `excel-financeiro.md`
- ❌ `curso 1.md`
- ❌ `teste.md`

### **Tamanho Ideal**
- **3 a 5 módulos** por curso
- **4 a 6 aulas** por módulo
- **Total: 15 a 30 aulas** por curso

### **Duração Estimada**
O sistema calcula automaticamente baseado em:
- Aulas curtas: ~15 min cada
- Total estimado: ~20-40 horas por curso

---

## 🚀 Resumo Rápido

```bash
# 1. Peça ao ChatGPT (use o prompt acima)

# 2. Salve como .md
nano courses/meu-curso.md

# 3. Converta para JSON
node md-to-json.js

# 4. Combine tudo
node combine.js

# 5. Importe
export ADMIN_TOKEN='token'
./import.sh

# ✅ PRONTO!
```

---

## 📞 Ajuda

Se tiver dúvidas, consulte:
- `exemplo-python.md` - Exemplo completo
- `WORKFLOW.md` - Fluxo geral
- `README.md` - Guia básico
