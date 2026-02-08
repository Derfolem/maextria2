# 🔄 Fluxo de Trabalho - Importação em Massa

## 📋 Passo a Passo Completo

### 1️⃣ Gerar Conteúdo no ChatGPT

Abra o ChatGPT e use o prompt:

```
Preciso que você gere conteúdo de cursos online no formato JSON para importação em massa.

ESTRUTURA OBRIGATÓRIA:
{
  "title": "Título do Curso",
  "description": "Descrição completa e detalhada",
  "difficulty": "beginner|intermediate|advanced",
  "duration_hours": 30,
  "certificate_price": 50.00,
  "modules": [
    {
      "title": "Nome do Módulo",
      "description": "Descrição do módulo",
      "lessons": [
        {
          "title": "Nome da Aula",
          "content": "Conteúdo em HTML com <h2>, <p>, <ul>, <li>, etc",
          "duration_minutes": 15
        }
      ]
    }
  ]
}

REGRAS:
1. Retorne APENAS o JSON válido
2. Cada curso: 3-5 módulos
3. Cada módulo: 3-7 aulas
4. Campo "content": HTML rico
5. Descrições profissionais
6. duration_minutes realista (5-30 min)

TEMA DO(S) CURSO(S): [SEU TEMA AQUI]
Número de cursos: 1
```

### 2️⃣ Salvar JSON Gerado

1. Copie o JSON que o ChatGPT retornar
2. Cole em um arquivo na pasta `courses/`:
   ```bash
   # Exemplo: criar novo arquivo
   nano courses/python-iniciante.json
   # Cole o conteúdo, Ctrl+O para salvar, Ctrl+X para sair
   ```

3. Repita para cada curso que quiser adicionar

### 3️⃣ Verificar Arquivos Salvos

```bash
ls -lh courses/
```

Você verá algo como:
```
exemplo-01.json
exemplo-02.json
python-iniciante.json
react-avancado.json
```

### 4️⃣ Combinar Todos os JSONs

Execute o script de combinação:

```bash
node combine.js
```

Saída esperada:
```
✅ Sucesso!
📄 Arquivo gerado: combined.json
📊 Total de cursos: 4
📦 Total de módulos: 15
📚 Total de aulas: 52
```

### 5️⃣ Revisar Arquivo Combinado (Opcional)

```bash
# Ver resumo
cat combined.json | jq '.courses[] | {title, modules: .modules | length}'

# Ou abrir no editor
nano combined.json
```

### 6️⃣ Obter Token de Admin

Você precisa estar logado como admin. Opções:

**A) Via navegador:**
1. Faça login no sistema como admin
2. Abra DevTools (F12)
3. Console: `localStorage.getItem('token')`
4. Copie o token

**B) Via API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maextria.com","password":"sua-senha"}'
```

Copie o token do retorno.

### 7️⃣ Importar para o Sistema

**Opção A: Usando o script (recomendado)**

```bash
export ADMIN_TOKEN='seu-token-aqui'
./import.sh
```

**Opção B: Curl manual**

```bash
curl -X POST http://localhost:3000/api/courses/bulk \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d @combined.json
```

### 8️⃣ Verificar Resultado

Se tudo deu certo, você verá:

```json
{
  "message": "4 curso(s) importado(s) com sucesso",
  "results": [
    {
      "title": "Python para Iniciantes",
      "course_id": "uuid-gerado",
      "modules": 4,
      "lessons": 15
    },
    ...
  ]
}
```

### 9️⃣ Publicar Cursos

Os cursos são criados como **NÃO PUBLICADOS**. Para publicar:

1. Acesse o painel admin
2. Vá em Cursos
3. Revise cada curso
4. Clique em "Publicar"

Ou via API:
```bash
curl -X PATCH http://localhost:3000/api/courses/{course_id}/publish \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_published": true}'
```

---

## 🔧 Solução de Problemas

### ❌ "Nenhum arquivo JSON encontrado"
- Verifique se os arquivos estão na pasta `courses/`
- Extensão deve ser `.json`

### ❌ "Formato inválido"
- Verifique se o JSON é válido (use https://jsonlint.com)
- Confirme que tem a estrutura correta

### ❌ "Título é obrigatório"
- Todo curso precisa do campo `title`

### ❌ "Pelo menos um módulo é necessário"
- Todo curso precisa ter array `modules` com pelo menos 1 item

### ❌ "Limite máximo de 50 cursos"
- Divida em múltiplas importações
- Mova alguns arquivos para outra pasta temporariamente

### ❌ Erro 401 "Não autorizado"
- Token expirado ou inválido
- Faça login novamente

### ❌ Erro 403 "Acesso negado"
- Apenas usuários admin podem importar em massa
- Verifique o role do seu usuário

---

## 💡 Dicas

### Organização de Arquivos
```
courses/
├── python/
│   ├── python-basico.json
│   └── python-avancado.json
├── javascript/
│   ├── js-intro.json
│   └── js-react.json
└── excel/
    ├── excel-basico.json
    └── excel-avancado.json
```

**Nota:** O script `combine.js` procura apenas na pasta `courses/` (não em subpastas).
Para importar por categoria, mova os arquivos desejados para `courses/` antes de combinar.

### Limpar Depois da Importação

```bash
# Mover cursos importados para pasta de backup
mkdir -p imported/$(date +%Y%m%d)
mv courses/*.json imported/$(date +%Y%m%d)/

# Ou deletar
rm courses/*.json

# Manter exemplos
git checkout courses/exemplo-*.json
```

### Importações Grandes

Se tiver muitos cursos (100+), faça em lotes:

```bash
# Lote 1
mv courses/lote2/*.json courses/backup/
node combine.js && ./import.sh

# Lote 2
mv courses/backup/*.json courses/
node combine.js && ./import.sh
```

---

## 📊 Checklist Final

Antes de importar, confira:

- [ ] Todos os arquivos JSON são válidos
- [ ] Cada curso tem título
- [ ] Cada curso tem pelo menos 1 módulo
- [ ] Conteúdo HTML está bem formatado
- [ ] Preços estão corretos
- [ ] Dificuldades estão corretas (beginner/intermediate/advanced)
- [ ] Durações são realistas
- [ ] Total de cursos não excede 50
- [ ] Você tem um backup dos arquivos JSON
- [ ] Token de admin está válido

✅ Tudo pronto? Execute `./import.sh` e boa sorte! 🚀
