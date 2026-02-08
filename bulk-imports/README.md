# 📦 Importação em Massa de Cursos

## 📁 Estrutura de Pastas

```
bulk-imports/
├── README.md           (este arquivo)
├── courses/            (seus cursos individuais aqui)
│   ├── curso-01.json
│   ├── curso-02.json
│   └── curso-03.json
├── combined.json       (resultado final para importar)
└── combine.js          (script para juntar todos os JSONs)
```

## 🔄 Como Usar

### 1️⃣ Gerar Cursos no ChatGPT
Use o prompt fornecido para gerar cada curso individualmente.

### 2️⃣ Salvar Cursos
Cole cada JSON gerado em um arquivo na pasta `courses/`:
- `curso-01.json`
- `curso-02.json`
- etc.

### 3️⃣ Combinar Todos os Cursos
Execute o script de combinação:
```bash
cd /home/fredomi/maextria/bulk-imports
node combine.js
```

### 4️⃣ Importar no Sistema
Use o arquivo `combined.json` gerado para fazer a importação via API:
```bash
curl -X POST http://localhost:3000/api/courses/bulk \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d @combined.json
```

## 📝 Formato dos Arquivos Individuais

Cada arquivo em `courses/` deve ter APENAS UM curso:

```json
{
  "title": "Nome do Curso",
  "description": "Descrição",
  "difficulty": "beginner",
  "duration_hours": 30,
  "modules": [...]
}
```

**ATENÇÃO**: NÃO incluir a chave `"courses": []` nos arquivos individuais!

## ✅ Validação

Antes de importar, verifique:
- [ ] Todos os arquivos JSON são válidos
- [ ] Cada curso tem pelo menos 1 módulo
- [ ] Cada módulo tem título
- [ ] Total de cursos não excede 50
