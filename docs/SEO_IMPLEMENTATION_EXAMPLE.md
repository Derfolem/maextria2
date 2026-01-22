# 📝 Exemplo de Implementação do Componente SEO

## Como Usar o Componente SEO nas Páginas

### 1. Página Home

```tsx
// frontend/src/pages/Home.tsx
import { SEO, createOrganizationSchema, createWebSiteSchema } from '../components/SEO';

export default function Home() {
  const organizationSchema = createOrganizationSchema();
  const websiteSchema = createWebSiteSchema();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema, websiteSchema],
  };

  return (
    <>
      <SEO
        title="MAEXTRIA - Plataforma de Cursos Online | Aprenda com Certificado"
        description="Aprenda com os melhores cursos online do Brasil. Certificados reconhecidos, conteúdo atualizado, suporte com IA e acesso vitalício. Comece grátis!"
        url="https://www.maextria.com.br/"
        image="https://www.maextria.com.br/maextria-logo.png"
        schema={schema}
        keywords={[
          'cursos online',
          'educação a distância',
          'certificados reconhecidos',
          'plataforma de ensino',
          'cursos de tecnologia',
          'programação',
          'inteligência artificial'
        ]}
      />

      {/* Seu conteúdo da Home aqui */}
      <div>
        <h1>Bem-vindo à MAEXTRIA</h1>
        {/* ... resto do conteúdo ... */}
      </div>
    </>
  );
}
```

### 2. Página de Cursos

```tsx
// frontend/src/pages/Courses.tsx
import { SEO } from '../components/SEO';

export default function Courses() {
  return (
    <>
      <SEO
        title="Cursos Online com Certificado | MAEXTRIA"
        description="Explore nossa biblioteca com centenas de cursos online. Tecnologia, negócios, design e mais. Certificados reconhecidos e acesso vitalício."
        url="https://www.maextria.com.br/courses"
        keywords={[
          'catálogo de cursos',
          'cursos online certificados',
          'cursos de tecnologia',
          'cursos de programação',
          'cursos online brasil'
        ]}
      />

      <div>
        <h1>Nossos Cursos</h1>
        {/* Lista de cursos */}
      </div>
    </>
  );
}
```

### 3. Página de Detalhes do Curso

```tsx
// frontend/src/pages/CourseDetail.tsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SEO, createCourseSchema, createBreadcrumbSchema } from '../components/SEO';
import { api } from '../lib/api';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    async function loadCourse() {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
    }
    loadCourse();
  }, [id]);

  if (!course) return <div>Carregando...</div>;

  const courseUrl = `https://www.maextria.com.br/course/${course.id}`;
  const courseImage = course.thumbnail || 'https://www.maextria.com.br/maextria-logo.png';

  // Schema.org para o curso
  const courseSchema = createCourseSchema({
    name: course.title,
    description: course.description,
    url: courseUrl,
    image: courseImage,
    price: course.price,
    instructor: course.instructor?.name || 'MAEXTRIA',
    duration: `${course.duration}h`,
    level: course.level || 'Iniciante',
  });

  // Breadcrumb para navegação
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.maextria.com.br/' },
    { name: 'Cursos', url: 'https://www.maextria.com.br/courses' },
    { name: course.title, url: courseUrl },
  ]);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [courseSchema, breadcrumbSchema],
  };

  return (
    <>
      <SEO
        title={`${course.title} - Curso Online com Certificado | MAEXTRIA`}
        description={course.description}
        url={courseUrl}
        image={courseImage}
        type="course"
        schema={schema}
        keywords={course.tags || ['curso online', 'certificado', course.category]}
      />

      <div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        {/* Resto do conteúdo do curso */}
      </div>
    </>
  );
}
```

### 4. Página do Professor

```tsx
// frontend/src/pages/TeacherLanding.tsx
import { SEO } from '../components/SEO';

export default function TeacherLanding() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'Seja um Professor na MAEXTRIA',
    'description': 'Compartilhe seu conhecimento e ganhe dinheiro ensinando online. Junte-se a milhares de professores na MAEXTRIA.',
    'url': 'https://www.maextria.com.br/sou-professor',
  };

  return (
    <>
      <SEO
        title="Seja um Professor | Ensine Online na MAEXTRIA"
        description="Compartilhe seu conhecimento e ganhe dinheiro ensinando online. Plataforma completa, suporte técnico e milhares de alunos esperando por você."
        url="https://www.maextria.com.br/sou-professor"
        schema={schema}
        keywords={[
          'ser professor online',
          'ensinar online',
          'criar cursos online',
          'ganhar dinheiro ensinando',
          'plataforma para professores'
        ]}
      />

      <div>
        <h1>Torne-se um Professor</h1>
        {/* Conteúdo da landing page */}
      </div>
    </>
  );
}
```

### 5. Página de Blog (se implementar)

```tsx
// frontend/src/pages/Blog.tsx
import { SEO } from '../components/SEO';

export default function BlogPost({ post }) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt,
    'image': post.coverImage,
    'datePublished': post.publishedAt,
    'dateModified': post.updatedAt,
    'author': {
      '@type': 'Person',
      'name': post.author.name,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'MAEXTRIA',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.maextria.com.br/maextria-logo.png',
      },
    },
  };

  return (
    <>
      <SEO
        title={`${post.title} | Blog MAEXTRIA`}
        description={post.excerpt}
        url={`https://www.maextria.com.br/blog/${post.slug}`}
        image={post.coverImage}
        type="article"
        schema={articleSchema}
        keywords={post.tags}
      />

      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

---

## ⚡ Analytics - Rastreamento de Eventos

### Implementar no componente CourseDetail:

```tsx
import { trackCourseView, trackEnrollment } from '../lib/analytics';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    async function loadCourse() {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);

      // Rastrear visualização do curso
      trackCourseView(response.data.id, response.data.title);
    }
    loadCourse();
  }, [id]);

  const handleEnroll = async () => {
    // ... lógica de matrícula ...

    // Rastrear matrícula
    trackEnrollment(course.id, course.title, course.price);
  };

  return (
    <>
      <SEO ... />
      <div>
        <button onClick={handleEnroll}>Matricular-se</button>
      </div>
    </>
  );
}
```

---

## 🎨 Otimização de Imagens

### Usar lazy loading para imagens:

```tsx
export default function CourseCard({ course }) {
  return (
    <div className="course-card">
      <img
        src={course.thumbnail}
        alt={`Curso ${course.title} - MAEXTRIA`}
        loading="lazy"
        width="400"
        height="225"
      />
      <h3>{course.title}</h3>
    </div>
  );
}
```

### Converter imagens para WebP:

```bash
# Instalar ferramenta de conversão
npm install --save-dev @squoosh/lib

# Criar script de otimização
# frontend/scripts/optimize-images.mjs
import { ImagePool } from '@squoosh/lib';
import { promises as fs } from 'fs';
import path from 'path';

const imagePool = new ImagePool();

async function optimizeImages() {
  const files = await fs.readdir('public/');
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  for (const file of imageFiles) {
    const filePath = path.join('public', file);
    const image = imagePool.ingestImage(filePath);

    await image.encode({
      webp: { quality: 85 },
    });

    const webpFile = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const { binary } = await image.encodedWith.webp;
    await fs.writeFile(path.join('public', webpFile), binary);
    console.log(`✓ Otimizado: ${webpFile}`);
  }

  await imagePool.close();
}

optimizeImages();
```

```bash
# Adicionar no package.json
"scripts": {
  "optimize-images": "node scripts/optimize-images.mjs"
}
```

---

## 📊 Monitoramento

### Criar página de status SEO:

```tsx
// frontend/src/pages/admin/SEOStatus.tsx
export default function SEOStatus() {
  return (
    <div className="seo-dashboard">
      <h1>Status SEO</h1>

      <div className="metrics">
        <div className="metric">
          <h3>Google Search Console</h3>
          <p>Impressões: 12.543</p>
          <p>Cliques: 456</p>
          <p>CTR: 3.6%</p>
        </div>

        <div className="metric">
          <h3>Palavras-chave Ranqueadas</h3>
          <p>Top 3: 12</p>
          <p>Top 10: 45</p>
          <p>Top 100: 234</p>
        </div>

        <div className="metric">
          <h3>Core Web Vitals</h3>
          <p>LCP: 1.8s ✅</p>
          <p>FID: 45ms ✅</p>
          <p>CLS: 0.05 ✅</p>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar componente SEO em todas as páginas principais
- [ ] Implementar Google Analytics 4
- [ ] Configurar rastreamento de eventos importantes
- [ ] Otimizar todas as imagens (WebP, lazy loading)
- [ ] Adicionar alt text descritivo em todas as imagens
- [ ] Implementar lazy loading de componentes pesados
- [ ] Verificar hierarquia de headings (H1, H2, H3)
- [ ] Adicionar links internos entre páginas relacionadas
- [ ] Testar performance com Lighthouse
- [ ] Testar mobile responsiveness
- [ ] Enviar sitemap ao Google Search Console
- [ ] Configurar conta Google Analytics
- [ ] Adicionar propriedade no Google Search Console

---

## 🚀 Próximos Passos

1. Implementar o componente SEO conforme exemplos acima
2. Seguir o guia `SEO_MARKETING_GUIDE.md` para estratégias completas
3. Monitorar métricas semanalmente
4. Ajustar estratégia baseado em dados
5. Criar conteúdo consistentemente (blog posts, vídeos, etc)

**Dúvidas?** Consulte o guia completo em `docs/SEO_MARKETING_GUIDE.md`
