# 📊 Configuração do Google Analytics 4 - Passo a Passo

## ✅ Você está aqui: Escolhendo o objetivo

**Recomendação:** Selecione **"Aumentar vendas online"**

### Por quê?
- ✅ Rastreia matrículas como conversões
- ✅ Mede receita de cada curso
- ✅ Calcula ROI das campanhas
- ✅ Entende o funil de vendas completo

---

## 🎯 Passo a Passo Completo

### Etapa 1: Criar Conta Google Analytics

1. Acesse: https://analytics.google.com
2. Clique em "Começar a medir" ou "Criar conta"
3. Preencha:
   ```
   Nome da conta: MAEXTRIA
   ☑️ Compartilhar dados com Google (recomendado)
   ```
4. Clique em "Avançar"

---

### Etapa 2: Criar Propriedade

```
Nome da propriedade: MAEXTRIA
Fuso horário: (GMT-03:00) Brasília
Moeda: Real brasileiro (BRL)
```

Clique em "Avançar"

---

### Etapa 3: Informações sobre a Empresa

```
Categoria: Educação
Tamanho da empresa: [escolha o seu]
  • 1-10 funcionários
  • 11-50 funcionários
  • 51-200 funcionários
  • Outro
```

---

### Etapa 4: Objetivos de Negócio

**✅ SELECIONE:** "Aumentar vendas online"

Outros objetivos disponíveis:
- ❌ Gerar leads
- ❌ Ver engajamento e retenção de usuários
- ❌ Entender tráfego da web e do app
- ❌ Outros objetivos de negócios

> **Nota:** Você pode adicionar outros objetivos depois!

---

### Etapa 5: Aceitar Termos

```
☑️ Li e aceito os Termos de Serviço do Google Analytics
☑️ Aceito o Aditivo de Processamento de Dados
☑️ [Se aplicável] Aceito termos de medição de dados do Google
```

Clique em "Criar"

---

### Etapa 6: Configurar Coleta de Dados

Selecione: **"Web"**

```
URL do site: https://www.maextria.com.br
Nome do stream: MAEXTRIA Website
```

Clique em "Criar stream"

---

### Etapa 7: COPIAR O ID DE MEDIÇÃO

🎉 Você verá uma tela com:

```
ID de medição: G-XXXXXXXXXX
```

📋 **COPIE ESSE CÓDIGO!** Exemplo: `G-ABC123XYZ9`

---

## 🔧 Configurar no Site MAEXTRIA

### Passo 1: Adicionar no arquivo .env

Abra o arquivo: `/home/fredomi/maextria/frontend/.env`

Adicione o ID que você copiou:
```env
VITE_GA_MEASUREMENT_ID=G-ABC123XYZ9
```

Substitua `G-ABC123XYZ9` pelo seu ID real!

### Passo 2: Fazer commit e deploy

```bash
cd /home/fredomi/maextria

# Adicionar arquivos modificados
git add frontend/.env frontend/src/main.tsx

# Fazer commit
git commit -m "feat: configurar Google Analytics 4"

# Fazer push
git push origin main
```

### Passo 3: Configurar no ambiente de produção

**Se usar Vercel:**
1. Acesse: https://vercel.com/dashboard
2. Vá no projeto MAEXTRIA
3. Settings > Environment Variables
4. Adicione:
   ```
   Name: VITE_GA_MEASUREMENT_ID
   Value: G-ABC123XYZ9
   ```
5. Redeploy o site

**Se usar Netlify:**
1. Acesse: https://app.netlify.com
2. Site settings > Environment variables
3. Adicione a variável
4. Redeploy

**Se usar Railway/VPS:**
Adicione a variável de ambiente no painel de controle ou arquivo `.env`

---

## ✅ Verificar se Está Funcionando

### Método 1: Google Analytics (tempo real)

1. No Google Analytics, vá em: **Relatórios > Tempo real**
2. Abra seu site em outra aba: https://www.maextria.com.br
3. Navegue pelo site (clique em cursos, páginas)
4. Volte ao Analytics
5. Você deve ver **1 usuário ativo** 🎉

### Método 2: Console do Navegador

1. Abra seu site
2. Pressione F12 (DevTools)
3. Vá na aba "Console"
4. Digite: `window.gtag`
5. Se aparecer `function`, está funcionando! ✅

### Método 3: Extensão do Chrome

1. Instale: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Ative a extensão
3. Abra seu site
4. No console você verá logs do Analytics

---

## 📊 Configurar Conversões (Importante!)

### Eventos que já estão configurados:

O arquivo `frontend/src/lib/analytics.ts` já rastreia automaticamente:

✅ **Visualização de curso** (`view_item`)
✅ **Matrícula em curso** (`purchase`) - **CONVERSÃO PRINCIPAL**
✅ **Início de checkout** (`begin_checkout`)
✅ **Cadastro de usuário** (`sign_up`)
✅ **Login** (`login`)
✅ **Busca no site** (`search`)
✅ **Conclusão de aula** (`lesson_complete`)

### Marcar eventos como conversões:

1. No Google Analytics, vá em: **Configuração > Eventos**
2. Aguarde 24-48h para os eventos aparecerem
3. Para cada evento importante, clique em "Marcar como conversão"
4. Principais para marcar:
   - ✅ `purchase` (matrícula)
   - ✅ `sign_up` (cadastro)
   - ✅ `begin_checkout`

---

## 🎯 Configurar Público-Alvo e Segmentos

### Criar Público-Alvo: "Abandonou Carrinho"

1. **Admin > Definições de público-alvo**
2. Clique em "Criar público-alvo"
3. Nome: "Abandonou Carrinho"
4. Condições:
   ```
   Incluir: begin_checkout (últimos 7 dias)
   Excluir: purchase (últimos 7 dias)
   ```
5. Salvar

**Uso:** Remarketing para quem iniciou mas não completou matrícula

### Criar Público-Alvo: "Alunos Ativos"

```
Incluir: purchase (últimos 30 dias)
```

**Uso:** Oferecer cursos avançados, pedir avaliações

### Criar Público-Alvo: "Visitantes Frequentes (não cadastrados)"

```
Incluir: page_view >= 5 (últimos 7 dias)
Excluir: sign_up
```

**Uso:** Remarketing para converter em leads

---

## 🔗 Integrar com Google Ads

Se você vai rodar anúncios:

1. No Google Analytics: **Admin > Vinculação de produtos > Google Ads**
2. Clique em "Vincular"
3. Selecione sua conta Google Ads
4. Ative "Importação automática de conversões"
5. Salvar

**Benefícios:**
- Otimização automática de campanhas
- Remarketing baseado em Analytics
- Relatórios unificados

---

## 🔗 Integrar com Google Search Console

1. No Google Analytics: **Admin > Vinculação de produtos > Search Console**
2. Clique em "Vincular"
3. Selecione a propriedade: maextria.com.br
4. Confirmar

**Benefícios:**
- Ver palavras-chave que trazem tráfego
- Identificar páginas com mais impressões
- Otimizar SEO baseado em dados reais

---

## 📈 Relatórios Importantes para Acompanhar

### Diariamente:
- **Tempo real**: Quantas pessoas estão no site agora
- **Conversões > Eventos**: Quantas matrículas hoje

### Semanalmente:
- **Aquisição > Tráfego**: De onde vêm os visitantes
- **Engajamento > Páginas**: Quais páginas mais visitadas
- **Conversões**: Taxa de conversão semanal

### Mensalmente:
- **Relatório de receita**: Faturamento via cursos
- **Funil de conversão**: Onde usuários desistem
- **Público-alvo**: Crescimento de usuários

---

## 🚨 Problemas Comuns e Soluções

### "Não vejo dados no tempo real"

**Soluções:**
1. Verifique se adicionou o ID correto no `.env`
2. Verifique se fez redeploy do site
3. Desabilite bloqueadores de anúncios (AdBlock, etc)
4. Aguarde 5-10 minutos após configurar
5. Teste em aba anônima

### "Eventos não aparecem"

**Solução:** Aguarde 24-48h. Eventos levam tempo para aparecer no Analytics.

### "ID de medição não encontrado"

**Solução:**
1. Vá em **Admin > Fluxos de dados**
2. Clique no stream "MAEXTRIA Website"
3. Copie o ID de medição (G-XXXXXXXXXX)

### "Não está rastreando em produção"

**Solução:** Verifique se a variável de ambiente está configurada no Vercel/Netlify:
```bash
# Verificar no código:
console.log(import.meta.env.VITE_GA_MEASUREMENT_ID);
```

---

## ✅ Checklist Final

**Configuração:**
- [ ] Conta Google Analytics criada
- [ ] Objetivo "Aumentar vendas" selecionado
- [ ] Stream Web criado
- [ ] ID de medição copiado (G-XXXXXXXXXX)

**Implementação:**
- [ ] ID adicionado no `.env`
- [ ] Código commitado e enviado
- [ ] Variável configurada em produção (Vercel/Netlify)
- [ ] Site redeployado

**Validação:**
- [ ] Aparece usuário no "Tempo real"
- [ ] Console não mostra erros
- [ ] Eventos sendo rastreados

**Otimização:**
- [ ] Eventos marcados como conversões
- [ ] Públicos-alvo criados
- [ ] Google Ads vinculado (se aplicável)
- [ ] Search Console vinculado

---

## 🎓 Recursos Adicionais

### Cursos Gratuitos:
- [Google Analytics Academy](https://analytics.google.com/analytics/academy/)
- [Google Skillshop - Analytics](https://skillshop.exceedlms.com/student/path/2938-google-analytics-4)

### Documentação:
- [Guia oficial GA4](https://support.google.com/analytics/answer/9304153)
- [Eventos recomendados](https://support.google.com/analytics/answer/9267735)

### Comunidades:
- r/GoogleAnalytics (Reddit)
- [Google Analytics Brasil](https://www.facebook.com/groups/googleanalyticsbrasil)

---

## 📞 Próximos Passos

Após configurar o Analytics:

1. ✅ Configurar Google Search Console (próximo passo!)
2. ✅ Implementar componente SEO nas páginas
3. ✅ Criar campanhas Google Ads
4. ✅ Configurar email marketing

**Dúvidas?** Consulte o guia completo em `SEO_MARKETING_GUIDE.md`

---

**Última atualização:** 22/01/2026
**Status:** ✅ Pronto para implementar
