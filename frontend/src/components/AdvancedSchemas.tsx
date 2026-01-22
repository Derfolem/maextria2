// Schemas avançados que melhoram SEO sem precisar criar conteúdo

export const createFAQSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'Os certificados da MAEXTRIA são reconhecidos?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Sim! Todos os certificados da MAEXTRIA são reconhecidos nacionalmente e podem ser utilizados para horas complementares, processos seletivos e curriculum vitae.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Como funciona o acesso aos cursos?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Após a matrícula, você tem acesso vitalício ao curso. Pode assistir quantas vezes quiser, no seu ritmo, sem prazo de validade.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Posso assistir pelo celular?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Sim! A plataforma MAEXTRIA é totalmente responsiva e funciona perfeitamente em celular, tablet e computador.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Quanto tempo tenho para concluir o curso?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Você tem acesso vitalício! Estude no seu próprio ritmo, sem pressa. O curso fica disponível para sempre após a matrícula.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Como recebo meu certificado?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Ao concluir 100% do curso, seu certificado é gerado automaticamente e fica disponível para download em PDF na plataforma.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Posso ser professor na MAEXTRIA?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Sim! Acesse a página "Seja Professor" e preencha o formulário. Nossa equipe avaliará seu perfil e entrará em contato.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Qual a diferença entre MAEXTRIA e outras plataformas?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Na MAEXTRIA você tem acesso vitalício, suporte com IA integrado, certificados reconhecidos e conteúdo de alta qualidade com foco em aplicação prática.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Preciso de conhecimento prévio?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Depende do curso! Cada curso indica o nível (Iniciante, Intermediário ou Avançado) e os pré-requisitos necessários na descrição.'
      }
    }
  ]
});

export const createHowToSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  'name': 'Como estudar na MAEXTRIA',
  'description': 'Guia passo a passo para começar a estudar na plataforma MAEXTRIA',
  'totalTime': 'PT5M',
  'estimatedCost': {
    '@type': 'MonetaryAmount',
    'currency': 'BRL',
    'value': '0'
  },
  'step': [
    {
      '@type': 'HowToStep',
      'position': 1,
      'name': 'Crie sua conta',
      'text': 'Acesse a página de registro e crie sua conta gratuita em menos de 1 minuto.',
      'url': 'https://www.maextria.com.br/register'
    },
    {
      '@type': 'HowToStep',
      'position': 2,
      'name': 'Escolha seu curso',
      'text': 'Navegue pelo catálogo e escolha o curso perfeito para você. Use os filtros por categoria e nível.',
      'url': 'https://www.maextria.com.br/courses'
    },
    {
      '@type': 'HowToStep',
      'position': 3,
      'name': 'Faça sua matrícula',
      'text': 'Clique em "Matricular-se" e complete o processo. Você terá acesso imediato ao conteúdo.'
    },
    {
      '@type': 'HowToStep',
      'position': 4,
      'name': 'Estude no seu ritmo',
      'text': 'Assista às aulas quando quiser, quantas vezes precisar. Sem pressa, sem prazo de validade.'
    },
    {
      '@type': 'HowToStep',
      'position': 5,
      'name': 'Receba seu certificado',
      'text': 'Ao concluir o curso, baixe seu certificado digital reconhecido nacionalmente.'
    }
  ]
});

export const createVideoObjectSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  'name': video.name,
  'description': video.description,
  'thumbnailUrl': video.thumbnailUrl,
  'uploadDate': video.uploadDate,
  'duration': video.duration || 'PT10M',
  'contentUrl': video.contentUrl,
  'embedUrl': video.contentUrl,
});

export const createAggregateRatingSchema = (rating: {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'AggregateRating',
  'ratingValue': rating.ratingValue,
  'reviewCount': rating.reviewCount,
  'bestRating': rating.bestRating || 5,
  'worstRating': rating.worstRating || 1,
});

export const createReviewSchema = (review: {
  author: string;
  reviewBody: string;
  reviewRating: number;
  datePublished: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  'author': {
    '@type': 'Person',
    'name': review.author,
  },
  'reviewBody': review.reviewBody,
  'reviewRating': {
    '@type': 'Rating',
    'ratingValue': review.reviewRating,
    'bestRating': 5,
    'worstRating': 1,
  },
  'datePublished': review.datePublished,
});

export const createOfferSchema = (offer: {
  price: number;
  priceCurrency?: string;
  availability?: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Offer',
  'price': offer.price,
  'priceCurrency': offer.priceCurrency || 'BRL',
  'availability': offer.availability || 'https://schema.org/InStock',
  'url': offer.url,
  'priceValidUntil': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});

// Schema para eventos (pode ser usado para webinars, lives)
export const createEventSchema = (event: {
  name: string;
  startDate: string;
  endDate?: string;
  location: string;
  description: string;
  image?: string;
  performer?: string;
  offers?: any;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  'name': event.name,
  'startDate': event.startDate,
  'endDate': event.endDate || event.startDate,
  'eventAttendanceMode': 'https://schema.org/OnlineEventAttendanceMode',
  'eventStatus': 'https://schema.org/EventScheduled',
  'location': {
    '@type': 'VirtualLocation',
    'url': event.location,
  },
  'description': event.description,
  'image': event.image || 'https://www.maextria.com.br/maextria-logo.png',
  'performer': {
    '@type': 'Person',
    'name': event.performer || 'MAEXTRIA',
  },
  'offers': event.offers || {
    '@type': 'Offer',
    'url': event.location,
    'price': '0',
    'priceCurrency': 'BRL',
    'availability': 'https://schema.org/InStock',
  },
});

// Schema para artigos de blog (preparado para futuro)
export const createArticleSchema = (article: {
  headline: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  description: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': article.headline,
  'image': article.image,
  'datePublished': article.datePublished,
  'dateModified': article.dateModified || article.datePublished,
  'author': {
    '@type': 'Person',
    'name': article.author,
  },
  'publisher': {
    '@type': 'Organization',
    'name': 'MAEXTRIA',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://www.maextria.com.br/maextria-logo.png',
    },
  },
  'description': article.description,
});

// Schema para carreiras/vagas (se adicionar no futuro)
export const createJobPostingSchema = (job: {
  title: string;
  description: string;
  datePosted: string;
  validThrough: string;
  employmentType: string;
  hiringOrganization: string;
  baseSalary?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  'title': job.title,
  'description': job.description,
  'datePosted': job.datePosted,
  'validThrough': job.validThrough,
  'employmentType': job.employmentType,
  'hiringOrganization': {
    '@type': 'Organization',
    'name': job.hiringOrganization,
    'sameAs': 'https://www.maextria.com.br',
  },
  'jobLocation': {
    '@type': 'Place',
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'BR',
    },
  },
  'baseSalary': job.baseSalary ? {
    '@type': 'MonetaryAmount',
    'currency': 'BRL',
    'value': {
      '@type': 'QuantitativeValue',
      'value': job.baseSalary,
      'unitText': 'MONTH',
    },
  } : undefined,
});
