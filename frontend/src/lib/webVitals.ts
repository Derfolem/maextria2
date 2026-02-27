// Web Vitals - Métricas de performance do Core Web Vitals
// Rastreia FCP, LCP, CLS, FID, TTFB e INP

type MetricName = 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';

interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type ReportHandler = (metric: Metric) => void;

// Envia métricas para o Google Analytics se disponível
const sendToAnalytics = (metric: Metric) => {
  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Log em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, `(${metric.rating})`);
  }
};

// Função para observar Web Vitals
export const reportWebVitals = (onReport: ReportHandler = sendToAnalytics) => {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const observeFCP = () => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const value = entry.startTime;
          onReport({
            name: 'FCP',
            value,
            rating: value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor',
            delta: value,
            id: `fcp-${Date.now()}`,
          });
          observer.disconnect();
        }
      }
    });
    try {
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // Navegador não suporta
    }
  };

  // Largest Contentful Paint (LCP)
  const observeLCP = () => {
    let lcpValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.startTime;
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      return;
    }

    // Reporta quando a página fica oculta ou após 10s
    const reportLCP = () => {
      if (lcpValue > 0) {
        onReport({
          name: 'LCP',
          value: lcpValue,
          rating: lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor',
          delta: lcpValue,
          id: `lcp-${Date.now()}`,
        });
        observer.disconnect();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportLCP();
      }
    });

    setTimeout(reportLCP, 10000);
  };

  // Cumulative Layout Shift (CLS)
  const observeCLS = () => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      return;
    }

    const reportCLS = () => {
      onReport({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
        delta: clsValue,
        id: `cls-${Date.now()}`,
      });
      observer.disconnect();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportCLS();
      }
    });
  };

  // First Input Delay (FID)
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = (entry as any).processingStart - entry.startTime;
        onReport({
          name: 'FID',
          value,
          rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
          delta: value,
          id: `fid-${Date.now()}`,
        });
        observer.disconnect();
      }
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // Navegador não suporta
    }
  };

  // Time to First Byte (TTFB)
  const observeTTFB = () => {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      const value = navEntry.responseStart - navEntry.requestStart;
      onReport({
        name: 'TTFB',
        value,
        rating: value < 800 ? 'good' : value < 1800 ? 'needs-improvement' : 'poor',
        delta: value,
        id: `ttfb-${Date.now()}`,
      });
    }
  };

  // Interaction to Next Paint (INP) - substitui FID em 2024
  const observeINP = () => {
    let maxINP = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = (entry as any).duration;
        if (duration > maxINP) {
          maxINP = duration;
        }
      }
    });

    try {
      observer.observe({ type: 'event', buffered: true });
    } catch {
      return;
    }

    const reportINP = () => {
      if (maxINP > 0) {
        onReport({
          name: 'INP',
          value: maxINP,
          rating: maxINP < 200 ? 'good' : maxINP < 500 ? 'needs-improvement' : 'poor',
          delta: maxINP,
          id: `inp-${Date.now()}`,
        });
        observer.disconnect();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportINP();
      }
    });
  };

  // Iniciar observadores
  observeFCP();
  observeLCP();
  observeCLS();
  observeFID();
  observeTTFB();
  observeINP();
};
