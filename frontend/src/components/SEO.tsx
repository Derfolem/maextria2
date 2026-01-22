import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'course';
  schema?: object;
  keywords?: string[];
}

export function SEO({
  title = 'MAEXTRIA - Plataforma de Cursos Online',
  description = 'Aprenda com os melhores cursos online. Certificados reconhecidos, conteúdo de qualidade e IA para acelerar seu aprendizado.',
  image = 'https://www.maextria.com.br/maextria-logo.png',
  url = 'https://www.maextria.com.br/',
  type = 'website',
  schema,
  keywords = ['cursos online', 'educação', 'certificados', 'aprendizado', 'IA', 'tecnologia'],
}: SEOProps) {
  useEffect(() => {
    // Atualizar título
    document.title = title;

    // Função auxiliar para atualizar meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', content);
    };

    // Meta tags básicas
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'MAEXTRIA', true);
    updateMetaTag('og:locale', 'pt_BR', true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Schema.org JSON-LD
    if (schema) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');

      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }

      scriptTag.textContent = JSON.stringify(schema);
    }
  }, [title, description, image, url, type, schema, keywords]);

  return null;
}

// Schema.org templates prontos
export const createCourseSchema = (course: {
  name: string;
  description: string;
  url: string;
  image: string;
  price: number;
  instructor: string;
  duration?: string;
  level?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  'name': course.name,
  'description': course.description,
  'url': course.url,
  'image': course.image,
  'provider': {
    '@type': 'Organization',
    'name': 'MAEXTRIA',
    'url': 'https://www.maextria.com.br',
    'logo': 'https://www.maextria.com.br/maextria-logo.png',
  },
  'offers': {
    '@type': 'Offer',
    'price': course.price,
    'priceCurrency': 'BRL',
    'availability': 'https://schema.org/InStock',
    'url': course.url,
  },
  'instructor': {
    '@type': 'Person',
    'name': course.instructor,
  },
  'educationalLevel': course.level || 'Beginner',
  'inLanguage': 'pt-BR',
  'timeRequired': course.duration,
});

export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  'name': 'MAEXTRIA',
  'url': 'https://www.maextria.com.br',
  'logo': 'https://www.maextria.com.br/maextria-logo.png',
  'description': 'Plataforma de cursos online com certificados reconhecidos e conteúdo de qualidade.',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'BR',
  },
  'sameAs': [
    // Adicione suas redes sociais aqui
    // 'https://www.facebook.com/maextria',
    // 'https://www.instagram.com/maextria',
    // 'https://www.linkedin.com/company/maextria',
  ],
});

export const createWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'MAEXTRIA',
  'url': 'https://www.maextria.com.br',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': 'https://www.maextria.com.br/courses?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
});

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url,
  })),
});
