import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useSystemConfigs } from '../../hooks/useSystemConfig';

export const FloatingContactWidget: React.FC = () => {
  const { data: configs = [] } = useSystemConfigs();
  const zaloItem = configs.find((item) => item.key === 'ZALO_URL');
  const zaloUrl = zaloItem?.value || 'https://zalo.me/0931143830';
  const href = zaloUrl.startsWith('http') ? zaloUrl : `https://zalo.me/${zaloUrl}`;

  return (
    <aside aria-label="Kênh liên hệ nhanh" className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 font-sans select-none items-end">
      {/* Zalo Floating Button Duy Nhất */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0068FF] text-white shadow-xl hover:bg-[#0054cc] hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-blue-400/30 animate-pulse hover:animate-none"
        title="Chat qua Zalo (0931143830)"
      >
        <span className="font-extrabold text-sm tracking-tighter">Zalo</span>
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
          <span>Tư vấn Zalo: 0931 143 830</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </span>
      </a>
    </aside>
  );
};
