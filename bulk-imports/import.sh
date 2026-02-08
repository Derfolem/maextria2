#!/bin/bash

# Script para importar cursos em massa via API
# Uso: ./import.sh [arquivo.json] [token-opcional]

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arquivo padrão
FILE="${1:-combined.json}"

# Verificar se arquivo existe
if [ ! -f "$FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo '$FILE' não encontrado!${NC}"
    echo -e "${YELLOW}💡 Execute 'node combine.js' primeiro para gerar o arquivo combined.json${NC}"
    exit 1
fi

# URL da API (ajuste se necessário)
API_URL="${API_URL:-http://localhost:3000/api/courses/bulk}"

# Token (pode ser passado como argumento ou variável de ambiente)
TOKEN="${2:-$ADMIN_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Erro: Token de autenticação não fornecido!${NC}"
    echo ""
    echo "Uso:"
    echo "  ./import.sh [arquivo] [token]"
    echo ""
    echo "Ou defina a variável de ambiente:"
    echo "  export ADMIN_TOKEN='seu-token-aqui'"
    echo "  ./import.sh"
    exit 1
fi

echo -e "${YELLOW}📦 Importando cursos...${NC}"
echo ""
echo "📄 Arquivo: $FILE"
echo "🔗 API: $API_URL"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$FILE")

# Separar corpo e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

# Verificar resultado
if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Sucesso!${NC}"
    echo ""
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
    echo ""
    echo -e "${GREEN}🎉 Cursos importados com sucesso!${NC}"
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${RED}❌ Erro de validação (400)${NC}"
    echo ""
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ Não autorizado (401)${NC}"
    echo -e "${YELLOW}💡 Verifique seu token de autenticação${NC}"
elif [ "$HTTP_CODE" -eq 403 ]; then
    echo -e "${RED}❌ Acesso negado (403)${NC}"
    echo -e "${YELLOW}💡 Apenas administradores podem importar cursos em massa${NC}"
else
    echo -e "${RED}❌ Erro HTTP $HTTP_CODE${NC}"
    echo ""
    echo "$HTTP_BODY"
fi

exit 0
