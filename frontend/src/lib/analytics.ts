// Google Analytics 4 Integration
// Substitua 'G-XXXXXXXXXX' pelo seu ID de medição real do GA4

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    console.warn('Google Analytics não configurado. Adicione VITE_GA_MEASUREMENT_ID no .env');
    return;
  }

  // Google Analytics 4 - gtag.js
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
      send_page_view: true
    });
  `;
  document.head.appendChild(script2);

  console.log('Google Analytics inicializado:', GA_MEASUREMENT_ID);
};

// Rastrear eventos personalizados
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
};

// Rastrear visualização de página
export const trackPageView = (url: string, title?: string) => {
  trackEvent('page_view', {
    page_path: url,
    page_title: title || document.title,
  });
};

// === EVENTOS DE CURSO ===

// Visualização de curso
export const trackCourseView = (courseId: string, courseName: string, category?: string) => {
  trackEvent('view_item', {
    item_id: courseId,
    item_name: courseName,
    item_category: category || 'Course',
    content_type: 'course',
  });
};

// Matrícula em curso
export const trackEnrollment = (
  courseId: string,
  courseName: string,
  price: number,
  transactionId?: string
) => {
  trackEvent('purchase', {
    transaction_id: transactionId || `enroll_${Date.now()}`,
    value: price,
    currency: 'BRL',
    items: [
      {
        item_id: courseId,
        item_name: courseName,
        item_category: 'Course',
        price: price,
        quantity: 1,
      },
    ],
  });
};

// Início de checkout
export const trackBeginCheckout = (courseId: string, courseName: string, price: number) => {
  trackEvent('begin_checkout', {
    value: price,
    currency: 'BRL',
    items: [
      {
        item_id: courseId,
        item_name: courseName,
        price: price,
      },
    ],
  });
};

// Adicionar ao carrinho
export const trackAddToCart = (courseId: string, courseName: string, price: number) => {
  trackEvent('add_to_cart', {
    value: price,
    currency: 'BRL',
    items: [
      {
        item_id: courseId,
        item_name: courseName,
        price: price,
      },
    ],
  });
};

// === EVENTOS DE USUÁRIO ===

// Registro de novo usuário
export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', {
    method: method,
  });
};

// Login
export const trackLogin = (method: string = 'email') => {
  trackEvent('login', {
    method: method,
  });
};

// === EVENTOS DE CONTEÚDO ===

// Busca no site
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

// Visualização de vídeo
export const trackVideoStart = (videoId: string, videoTitle: string) => {
  trackEvent('video_start', {
    video_id: videoId,
    video_title: videoTitle,
  });
};

export const trackVideoComplete = (videoId: string, videoTitle: string) => {
  trackEvent('video_complete', {
    video_id: videoId,
    video_title: videoTitle,
  });
};

// Progresso em aula
export const trackLessonComplete = (
  courseId: string,
  lessonId: string,
  progress: number
) => {
  trackEvent('lesson_complete', {
    course_id: courseId,
    lesson_id: lessonId,
    progress: progress,
  });
};

// === EVENTOS DE ENGAJAMENTO ===

// Compartilhamento
export const trackShare = (method: string, contentType: string, itemId: string) => {
  trackEvent('share', {
    method: method, // 'facebook', 'twitter', 'whatsapp', etc
    content_type: contentType,
    item_id: itemId,
  });
};

// Download de certificado
export const trackCertificateDownload = (courseId: string, courseName: string) => {
  trackEvent('certificate_download', {
    course_id: courseId,
    course_name: courseName,
  });
};

// Uso da IA
export const trackAIInteraction = (action: string, context?: string) => {
  trackEvent('ai_interaction', {
    action: action, // 'chat', 'help', 'content_generation'
    context: context,
  });
};

// === EVENTOS DE CONVERSÃO ===

// Lead gerado (ex: cadastro newsletter)
export const trackGenerateLead = (source: string = 'newsletter') => {
  trackEvent('generate_lead', {
    source: source,
  });
};

// Formulário enviado
export const trackFormSubmit = (formName: string) => {
  trackEvent('form_submit', {
    form_name: formName,
  });
};

// === EVENTOS DE ERRO ===

// Rastrear erros
export const trackError = (errorMessage: string, errorType: string, page?: string) => {
  trackEvent('exception', {
    description: errorMessage,
    error_type: errorType,
    page: page || window.location.pathname,
    fatal: false,
  });
};

// === EVENTOS PARA PROFESSORES ===

// Criação de curso por professor
export const trackCourseCreated = (courseId: string, category: string) => {
  trackEvent('course_created', {
    course_id: courseId,
    category: category,
  });
};

// Publicação de conteúdo
export const trackContentPublished = (contentType: string, contentId: string) => {
  trackEvent('content_published', {
    content_type: contentType,
    content_id: contentId,
  });
};

// === HELPERS ===

// Setar propriedades do usuário
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('set', 'user_properties', properties);
  }
};

// Exemplo de uso:
// setUserProperties({
//   user_role: 'student',
//   subscription_tier: 'premium',
//   total_courses: 5,
// });

// Setar ID do usuário
export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('set', { user_id: userId });
  }
};

export default {
  initGA,
  trackEvent,
  trackPageView,
  trackCourseView,
  trackEnrollment,
  trackBeginCheckout,
  trackAddToCart,
  trackSignUp,
  trackLogin,
  trackSearch,
  trackVideoStart,
  trackVideoComplete,
  trackLessonComplete,
  trackShare,
  trackCertificateDownload,
  trackAIInteraction,
  trackGenerateLead,
  trackFormSubmit,
  trackError,
  trackCourseCreated,
  trackContentPublished,
  setUserProperties,
  setUserId,
};
