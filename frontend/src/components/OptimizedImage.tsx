import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fallbackChar?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * Componente de imagem otimizada com suporte a AVIF, WebP e fallback PNG/JPG
 * Implementa lazy loading automático e placeholder durante carregamento
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  fallbackChar,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Gera URLs para formatos otimizados se a imagem for local
  const isLocalImage = src.startsWith('/') && !src.startsWith('//');
  const basePath = src.replace(/\.(png|jpg|jpeg)$/i, '');

  // Se houver erro ou não houver src, mostrar fallback
  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))] text-white ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="text-4xl font-bold">
          {fallbackChar || alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Para imagens externas, usar img simples com lazy loading
  if (!isLocalImage) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        onError={() => setHasError(true)}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        style={{ objectFit }}
      />
    );
  }

  // Para imagens locais, usar picture com AVIF e WebP
  return (
    <picture>
      <source srcSet={`${basePath}.avif`} type="image/avif" />
      <source srcSet={`${basePath}.webp`} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ objectFit }}
      />
    </picture>
  );
}

/**
 * Versão simplificada para thumbnails de cursos
 */
export function CourseThumbnail({
  src,
  title,
  className = '',
}: {
  src?: string | null;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))] text-white ${className}`}
      >
        <span className="text-4xl font-bold">{title.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={title}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      fallbackChar={title.charAt(0)}
    />
  );
}
