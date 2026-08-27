import React, { useState, useMemo } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'banner';
  category?: string;
}

// Map curated high-resolution menswear images by category keywords
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'ao-so-mi': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
  'ao-polo': 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
  'ao-tshirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  'ao-khoac': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  'quan': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
};

function getSmartFallbackImage(category?: string, alt?: string): string {
  const text = `${category || ''} ${alt || ''}`.toLowerCase();
  
  if (text.includes('sơ mi') || text.includes('oxford') || text.includes('shirt')) {
    return CATEGORY_FALLBACK_IMAGES['ao-so-mi'];
  }
  if (text.includes('polo')) {
    return CATEGORY_FALLBACK_IMAGES['ao-polo'];
  }
  if (text.includes('t-shirt') || text.includes('thun') || text.includes('tee')) {
    return CATEGORY_FALLBACK_IMAGES['ao-tshirt'];
  }
  if (text.includes('khoác') || text.includes('blazer') || text.includes('suit') || text.includes('jacket') || text.includes('heritage')) {
    return CATEGORY_FALLBACK_IMAGES['ao-khoac'];
  }
  if (text.includes('quần') || text.includes('kaki') || text.includes('jean') || text.includes('pant')) {
    return CATEGORY_FALLBACK_IMAGES['quan'];
  }
  return CATEGORY_FALLBACK_IMAGES['default'];
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'KTD Store Menswear',
  className = '',
  aspectRatio = 'portrait',
  category = 'Collection',
}) => {
  const [errorCount, setErrorCount] = useState<number>(0);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    banner: 'aspect-[21/9]',
  }[aspectRatio];

  const smartFallback = useMemo(() => getSmartFallbackImage(category, alt), [category, alt]);

  // Determine current image to display:
  // errorCount = 0: try primary src if available, else smart fallback
  // errorCount = 1: try smart fallback
  // errorCount = 2: try local bundled asset
  // errorCount >= 3: show vector luxury placeholder
  let currentSrc: string | null = null;
  if (errorCount === 0 && src && src.trim() !== '') {
    currentSrc = src;
  } else if (errorCount <= 1) {
    currentSrc = smartFallback;
  } else if (errorCount === 2) {
    currentSrc = '/atelier_fashion_editorial.png';
  }

  const handleImageError = () => {
    setErrorCount((prev) => prev + 1);
  };

  if (currentSrc) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#EFECE6] ${aspectClasses}`}>
        <img
          src={currentSrc}
          alt={alt}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 ${className}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Luxury SVG Placeholder for when completely offline / all sources failed
  return (
    <div
      className={`relative w-full h-full bg-[#EFECE6] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden group ${aspectClasses} ${className}`}
    >
      {/* Editorial Watermark background lines */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <span className="font-editorial text-[100px] italic font-bold tracking-widest text-[#1A1A1A]">
          KTD
        </span>
      </div>

      {/* Outer subtle frame */}
      <div className="absolute inset-3 border border-[#1A1A1A]/10 pointer-events-none transition-colors duration-500 group-hover:border-[#C8A96E]/40" />

      {/* Elegant Fashion Silhouette Vector */}
      <div className="relative z-10 flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-full border border-[#C8A96E]/40 flex items-center justify-center bg-white/70 backdrop-blur-sm text-[#C8A96E] shadow-sm transition-transform duration-500 group-hover:scale-110">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
              d="M12 4a2 2 0 100 4 2 2 0 000-4zM12 8c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
              d="M6 14l2 6h8l2-6"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#C8A96E]">
            {category}
          </span>
          <p className="font-editorial italic text-base text-[#1A1A1A] line-clamp-1 max-w-[180px]">
            {alt}
          </p>
        </div>
      </div>
    </div>
  );
};
