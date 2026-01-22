# 🚀 Guia Completo de SEO e Marketing Digital - MAEXTRIA

## 📋 Índice
1. [Configuração Técnica (SEO On-Page)](#1-configuracao-tecnica-seo-on-page)
2. [Google Search Console e Analytics](#2-google-search-console-e-analytics)
3. [Performance e Core Web Vitals](#3-performance-e-core-web-vitals)
4. [Estratégias de Conteúdo](#4-estrategias-de-conteudo)
5. [Link Building (SEO Off-Page)](#5-link-building-seo-off-page)
6. [Marketing nas Redes Sociais](#6-marketing-nas-redes-sociais)
7. [Google Ads e Marketing Pago](#7-google-ads-e-marketing-pago)
8. [Email Marketing](#8-email-marketing)
9. [Métricas e KPIs](#9-metricas-e-kpis)

---

## 1. Configuração Técnica (SEO On-Page)

### ✅ Já Implementado:
- ✅ Meta tags básicas (title, description)
- ✅ Open Graph e Twitter Cards
- ✅ robots.txt e sitemap.xml
- ✅ Canonical URLs
- ✅ SSL/HTTPS
- ✅ Componente SEO com Schema.org

### 🔧 Próximos Passos:

#### A) Implementar o Componente SEO nas Páginas

**Página inicial (Home.tsx):**
```tsx
import { SEO, createOrganizationSchema, createWebSiteSchema } from '../components/SEO';

function Home() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      createOrganizationSchema(),
      createWebSiteSchema(),
    ],
  };

  return (
    <>
      <SEO
        title="MAEXTRIA - Plataforma de Cursos Online | Aprenda com Certificado"
        description="Cursos online de tecnologia, negócios e desenvolvimento pessoal. Certificados reconhecidos, conteúdo atualizado e suporte com IA. Comece grátis!"
        url="https://www.maextria.com.br/"
        schema={schema}
        keywords={['cursos online', 'educação a distância', 'certificados', 'tecnologia', 'programação', 'IA', 'inteligência artificial']}
      />
      {/* resto do componente */}
    </>
  );
}
```

**Página de curso individual (CourseDetail.tsx):**
```tsx
import { SEO, createCourseSchema, createBreadcrumbSchema } from '../components/SEO';

function CourseDetail({ course }) {
  const courseSchema = createCourseSchema({
    name: course.title,
    description: course.description,
    url: `https://www.maextria.com.br/course/${course.id}`,
    image: course.thumbnail,
    price: course.price,
    instructor: course.instructor.name,
    duration: `${course.duration}h`,
    level: course.level,
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.maextria.com.br/' },
    { name: 'Cursos', url: 'https://www.maextria.com.br/courses' },
    { name: course.title, url: `https://www.maextria.com.br/course/${course.id}` },
  ]);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [courseSchema, breadcrumbSchema],
  };

  return (
    <>
      <SEO
        title={`${course.title} - MAEXTRIA`}
        description={course.description}
        url={`https://www.maextria.com.br/course/${course.id}`}
        image={course.thumbnail}
        type="course"
        schema={schema}
        keywords={course.tags || []}
      />
      {/* resto do componente */}
    </>
  );
}
```

#### B) Otimizar Imagens
```bash
# Todas as imagens devem ter:
1. Alt text descritivo
2. Formato WebP ou AVIF
3. Lazy loading
4. Dimensões apropriadas
```

#### C) Adicionar Heading Structure
```html
<!-- Cada página deve ter hierarquia correta: -->
<h1>Título principal (apenas 1 por página)</h1>
<h2>Seções principais</h2>
<h3>Subseções</h3>
```

---

## 2. Google Search Console e Analytics

### 🎯 Passo a Passo - Google Search Console

#### 1. Criar Conta e Verificar Propriedade
```
1. Acesse: https://search.google.com/search-console
2. Clique em "Adicionar propriedade"
3. Escolha "Domínio" e insira: maextria.com.br
4. Verificação via DNS (recomendado):
   - Copie o registro TXT fornecido
   - Adicione no seu provedor DNS
   - Aguarde propagação (até 48h)
```

#### 2. Enviar Sitemap
```
1. No Search Console, vá em "Sitemaps"
2. Adicione: https://www.maextria.com.br/sitemap.xml
3. Clique em "Enviar"
```

#### 3. Solicitar Indexação das Páginas Principais
```
1. No Search Console, vá em "Inspeção de URL"
2. Cole cada URL principal:
   - https://www.maextria.com.br/
   - https://www.maextria.com.br/courses
   - https://www.maextria.com.br/sou-professor
3. Clique em "Solicitar indexação"
```

### 📊 Google Analytics 4

#### 1. Criar Propriedade GA4
```
1. Acesse: https://analytics.google.com
2. Criar conta/propriedade
3. Nome: MAEXTRIA
4. Fuso horário: (GMT-03:00) Brasília
5. Copiar o ID de medição (G-XXXXXXXXXX)
```

#### 2. Instalar GA4 no Site

Criar arquivo `/frontend/src/lib/analytics.ts`:
```typescript
export const initGA = () => {
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Seu ID aqui

  // Google Analytics 4
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;
  document.head.appendChild(script2);
};

// Rastrear eventos personalizados
export const trackEvent = (eventName: string, parameters?: object) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
};

// Exemplos de eventos importantes:
export const trackCourseView = (courseId: string, courseName: string) => {
  trackEvent('view_item', {
    item_id: courseId,
    item_name: courseName,
    item_category: 'Course',
  });
};

export const trackEnrollment = (courseId: string, courseName: string, price: number) => {
  trackEvent('purchase', {
    transaction_id: `enroll_${Date.now()}`,
    value: price,
    currency: 'BRL',
    items: [{
      item_id: courseId,
      item_name: courseName,
    }],
  });
};
```

Adicionar no `main.tsx`:
```typescript
import { initGA } from './lib/analytics';

// Logo após o ReactDOM.render
if (import.meta.env.PROD) {
  initGA();
}
```

---

## 3. Performance e Core Web Vitals

### ⚡ Otimizações Críticas

#### A) Lazy Loading de Componentes
```typescript
// Substituir imports diretos por lazy loading:
import { lazy, Suspense } from 'react';

const CoursePlayer = lazy(() => import('./pages/student/CoursePlayer'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));

// No router:
<Suspense fallback={<div>Carregando...</div>}>
  <CoursePlayer />
</Suspense>
```

#### B) Otimizar Bundle Size
```bash
# Analisar tamanho do bundle:
npm run build -- --mode analyze

# Instalar plugin de análise:
npm install --save-dev rollup-plugin-visualizer

# Adicionar no vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }),
  ],
});
```

#### C) Compressão Gzip/Brotli
```typescript
// Adicionar no vite.config.ts:
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

#### D) Preload de Recursos Críticos
```html
<!-- No index.html: -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://zcrwmdctwjqrvzbvfpuj.supabase.co">
```

### 📏 Metas Core Web Vitals:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## 4. Estratégias de Conteúdo

### 📝 Blog/Artigos SEO

#### Criar seção de blog:
```
/blog
/blog/como-aprender-programacao
/blog/melhores-cursos-online-2026
/blog/inteligencia-artificial-iniciantes
```

#### Palavras-chave para ranquear (Brasil):

**Alta Prioridade:**
- "cursos online com certificado" (12.000 buscas/mês)
- "plataforma de cursos" (8.000 buscas/mês)
- "curso online gratuito" (18.000 buscas/mês)
- "certificado reconhecido" (5.000 buscas/mês)
- "curso de programação online" (9.000 buscas/mês)

**Long-tail (mais específicas):**
- "melhor plataforma de cursos online brasil"
- "curso online com certificado grátis"
- "como aprender programação do zero"

#### Estrutura de Artigo SEO:
```markdown
# [Palavra-chave] - Guia Completo 2026

## Introdução (200 palavras)
- Problema do leitor
- Promessa do artigo

## H2: O que é [tópico]? (300 palavras)
## H2: Por que [tópico] é importante? (300 palavras)
## H2: Como [fazer algo]? (500 palavras)
  ### H3: Passo 1
  ### H3: Passo 2
## H2: Melhores práticas (400 palavras)
## H2: Conclusão (200 palavras)
  - Call-to-action para curso relacionado

Total: 1.900+ palavras
```

---

## 5. Link Building (SEO Off-Page)

### 🔗 Estratégias para Conseguir Backlinks

#### A) Parcerias Educacionais
```
- Contatar universidades para parcerias
- Oferecer cursos gratuitos para instituições
- Criar conteúdo guest post para blogs educacionais
```

#### B) Diretórios e Listagens
```
✅ Google Meu Negócio
✅ Bing Places
✅ Cursos Brasil (cursosbrasil.com.br)
✅ Hotmart (para afiliados)
✅ Eduk (parcerias)
✅ LinkedIn Company Page
```

#### C) Press Release
```
- Enviar para portais de tecnologia
- Blogs de educação
- Startups Brasil
```

#### D) Conteúdo Linkável
```
- Criar infográficos sobre educação
- Estatísticas do mercado de cursos
- Ferramentas gratuitas (calculadora de ROI de cursos, etc)
```

---

## 6. Marketing nas Redes Sociais

### 📱 Estratégia por Plataforma

#### **Instagram** (@maextria)
```
Conteúdo:
- Carrossel: "5 dicas para [tópico]"
- Reels: Snippet de 30s de aula
- Stories: Bastidores, alunos aprovados
- Lives: Aulas gratuitas semanais

Frequência: 1 post/dia + 3 stories/dia
Hashtags: #cursosonline #educacao #tecnologia #programacao
```

#### **LinkedIn** (MAEXTRIA Company Page)
```
Conteúdo:
- Artigos sobre mercado de trabalho
- Cases de sucesso de alunos
- Dicas de carreira
- Vagas de emprego (parceiros)

Frequência: 3x/semana
```

#### **YouTube** (Canal MAEXTRIA)
```
Conteúdo:
- Aulas gratuitas (15-20 min)
- Tutoriais rápidos
- "Um dia na vida de [profissão]"
- Reviews de tecnologia

SEO YouTube:
- Títulos com palavras-chave
- Descrições completas (300+ palavras)
- Tags relevantes
- Thumbnails chamativas
```

#### **TikTok** (@maextria)
```
Conteúdo:
- Dicas rápidas (15-60s)
- Mitos vs Verdades sobre educação
- Trends educacionais

Frequência: 2-3 vídeos/dia
```

#### **Facebook Groups**
```
- Criar grupo "Comunidade MAEXTRIA"
- Participar de grupos de tecnologia/educação
- Responder dúvidas (link building social)
```

---

## 7. Google Ads e Marketing Pago

### 💰 Campanhas Recomendadas

#### A) Google Search Ads

**Campanha 1: Branded**
```
Palavras-chave:
- maextria
- maextria cursos
- www.maextria.com.br

Orçamento: R$ 10-20/dia
CPC estimado: R$ 0.50-1.00
```

**Campanha 2: Genérico - Cursos Online**
```
Palavras-chave:
- cursos online com certificado
- plataforma de cursos
- curso de programação online

Orçamento: R$ 50-100/dia
CPC estimado: R$ 2.00-5.00
```

**Campanha 3: Competitor**
```
Palavras-chave:
- udemy alternativa
- coursera brasil
- alura grátis

Orçamento: R$ 30-50/dia
CPC estimado: R$ 1.50-3.00
```

#### B) Google Display Ads
```
- Banners 300x250, 728x90, 160x600
- Remarketing (visitantes que não compraram)
- Orçamento: R$ 20-40/dia
```

#### C) YouTube Ads
```
- In-Stream Ads (pré-roll 15s)
- Discovery Ads
- Targeting: Interesse em educação/tecnologia
- Orçamento: R$ 30-50/dia
```

#### D) Meta Ads (Facebook + Instagram)
```
Objetivos:
- Tráfego (enviar para landing pages)
- Conversões (inscrições em cursos)
- Engajamento (curtidas, comentários)

Públicos:
- Idade: 18-45
- Interesses: Educação online, programação, empreendedorismo
- Lookalike: Baseado em compradores

Orçamento: R$ 50-100/dia
```

---

## 8. Email Marketing

### 📧 Fluxos de Automação

#### Fluxo 1: Boas-vindas (Novo Cadastro)
```
Email 1 (Imediato): Bem-vindo + Link de verificação
Email 2 (+1 dia): Conheça nossos cursos mais populares
Email 3 (+3 dias): Cupom 20% OFF primeiro curso
Email 4 (+7 dias): Depoimentos de alunos
Email 5 (+14 dias): Última chance - cupom expira hoje
```

#### Fluxo 2: Carrinho Abandonado
```
Email 1 (+2h): Esqueceu algo?
Email 2 (+24h): Ainda interessado? +10% desconto
Email 3 (+3 dias): Última chance - 30% OFF
```

#### Fluxo 3: Pós-compra
```
Email 1 (Imediato): Confirmação + Acesso ao curso
Email 2 (+3 dias): Como está o curso? Precisa de ajuda?
Email 3 (+30 dias): Complete o curso e ganhe certificado
Email 4 (Conclusão): Parabéns! + Recomendar próximo curso
```

#### Newsletter Semanal
```
Assunto: 📚 5 novidades da semana na MAEXTRIA
Conteúdo:
- Novos cursos lançados
- Dica da semana
- Case de sucesso
- Promoção relâmpago
```

### 🛠️ Ferramentas Recomendadas:
- **Email**: SendGrid, Mailgun, AWS SES
- **Automação**: Customer.io, Brevo (Sendinblue)
- **Templates**: MJML, React Email

---

## 9. Métricas e KPIs

### 📊 Dashboard de Métricas SEO

#### Métricas Semanais:
```
Google Search Console:
- Impressões (meta: +10%/semana)
- Cliques (meta: +15%/semana)
- CTR (meta: > 3%)
- Posição média (meta: subir 2 posições/semana)

Google Analytics:
- Sessões orgânicas (meta: +20%/mês)
- Taxa de rejeição (meta: < 50%)
- Tempo na página (meta: > 2min)
- Páginas/sessão (meta: > 3)
```

#### Métricas Mensais:
```
SEO:
- Palavras-chave no Top 10 (meta: +5/mês)
- Backlinks novos (meta: +10/mês)
- Domain Authority (meta: +1/trimestre)

Conversão:
- Taxa de conversão (meta: > 2%)
- Custo por lead (meta: < R$ 10)
- ROI de anúncios (meta: > 300%)
```

#### Ferramentas de Monitoramento:
```
✅ Google Search Console (grátis)
✅ Google Analytics 4 (grátis)
✅ Ubersuggest (palavras-chave)
✅ Ahrefs / SEMrush (backlinks, concorrentes)
✅ PageSpeed Insights (performance)
✅ GTmetrix (performance)
```

---

## 🎯 Checklist de Implementação (Prioridades)

### Semana 1-2: Fundação
- [ ] Configurar Google Search Console
- [ ] Configurar Google Analytics 4
- [ ] Implementar componente SEO nas páginas principais
- [ ] Adicionar Schema.org markup
- [ ] Otimizar meta descriptions
- [ ] Enviar sitemap

### Semana 3-4: Conteúdo
- [ ] Escrever 4 artigos de blog (palavras-chave principais)
- [ ] Criar perfis nas redes sociais
- [ ] Configurar Google Meu Negócio
- [ ] Adicionar no LinkedIn Company

### Mês 2: Otimização
- [ ] Otimizar Core Web Vitals
- [ ] Implementar lazy loading
- [ ] Comprimir imagens
- [ ] Configurar email marketing
- [ ] Criar fluxos de automação

### Mês 3: Crescimento
- [ ] Iniciar campanhas Google Ads
- [ ] Iniciar campanhas Meta Ads
- [ ] Link building (10+ backlinks)
- [ ] Criar canal YouTube
- [ ] Publicar 8 artigos blog

### Mês 4+: Escala
- [ ] Otimizar campanhas baseado em dados
- [ ] Expandir estratégia de conteúdo
- [ ] Parcerias com influenciadores
- [ ] Afiliados / parceiros
- [ ] Relações públicas (PR)

---

## 💡 Dicas Finais

### Do's ✅
- Seja consistente (publicar regularmente)
- Foque em qualidade, não quantidade
- Responda comentários e mensagens
- Analise dados semanalmente
- Teste A/B tudo (títulos, CTAs, anúncios)
- Mantenha site rápido (< 3s de carregamento)

### Don'ts ❌
- Não compre backlinks
- Não copie conteúdo de outros sites
- Não use keyword stuffing
- Não ignore mobile
- Não negligencie a experiência do usuário
- Não desista nos primeiros 3 meses

---

## 📈 Expectativa Realista de Resultados

### Mês 1-3:
- 100-500 visitantes orgânicos/mês
- 5-10 palavras-chave ranqueadas
- Primeiras vendas orgânicas

### Mês 4-6:
- 500-2.000 visitantes orgânicos/mês
- 20-50 palavras-chave ranqueadas
- 10-30 vendas orgânicas/mês

### Mês 7-12:
- 2.000-10.000 visitantes orgânicos/mês
- 50-200 palavras-chave ranqueadas
- 50-200 vendas orgânicas/mês

### 1 ano+:
- 10.000-50.000 visitantes orgânicos/mês
- 200-1000 palavras-chave ranqueadas
- 200-1000 vendas orgânicas/mês
- Primeiras posições para palavras-chave principais

**NOTA:** Estes números dependem de:
- Investimento em anúncios pagos
- Qualidade e quantidade de conteúdo
- Consistência nas publicações
- Concorrência no nicho
- Autoridade do domínio

---

## 🆘 Recursos e Ajuda

### Cursos Gratuitos:
- [Google Digital Garage](https://learndigital.withgoogle.com/digitalgarage)
- [HubSpot Academy](https://academy.hubspot.com)
- [SEMrush Academy](https://www.semrush.com/academy/)

### Comunidades:
- r/SEO (Reddit)
- SEO Brasil (Facebook)
- Growth Hackers Brasil

### Ferramentas Grátis:
- Google Keyword Planner
- Google Trends
- Answer The Public
- Ubersuggest (versão gratuita)

---

**Última atualização:** 22/01/2026
**Contato:** suporte@maextria.com.br
