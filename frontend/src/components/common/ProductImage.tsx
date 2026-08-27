import React, { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'banner';
  category?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'KTD Store Product',
  className = '',
  aspectRatio = 'portrait',
  category = 'Collection',
}) => {
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    banner: 'aspect-[21/9]',
  }[aspectRatio];

  const hasValidImage = src && src.trim() !== '' && !error;

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 ${className}`}
        loading="lazy"
      />
    );
  }

  // Luxury SVG Placeholder for empty / loading error images
  return (
    <div
      className={`relative w-full h-full bg-[#EFECE6] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden group ${aspectClasses} ${className}`}
    >
      {/* Editorial Watermark background lines */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <span className="font-editorial text-[120px] italic font-bold tracking-widest text-[#1A1A1A]">
          KTD
        </span>
      </div>

      {/* Outer subtle frame */}
      <div className="absolute inset-3 border border-[#1A1A1A]/10 pointer-events-none transition-colors duration-500 group-hover:border-[#C8A96E]/40" />

      {/* Elegant Fashion Silhouette Vector */}
      <div className="relative z-10 flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-full border border-[#C8A96E]/40 flex items-center justify-center bg-white/60 backdrop-blur-sm text-[#C8A96E] shadow-sm transition-transform duration-500 group-hover:scale-110">
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
          <p className="font-editorial italic text-base text-[#1A1A1A] line-clamp-1 max-w-[160px]">
            {alt}
          </p>
        </div>
      </div>

      {/* Hover prompt tag */}
      <span className="absolute bottom-5 font-mono text-[9px] text-[#6E6E6E] opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-wider">
        + ADD IMAGE URL
      </span>
    </div>
  );
};
