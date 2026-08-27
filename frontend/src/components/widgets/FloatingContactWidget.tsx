import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Facebook, ExternalLink } from 'lucide-react';

interface SystemConfigItem {
  key: string;
  value: string;
}

export const FloatingContactWidget: React.FC = () => {
  const [hotline, setHotline] = useState('1900 8888');
  const [zaloUrl, setZaloUrl] = useState('https://zalo.me');
  const [fanpageUrl, setFanpageUrl] = useState('https://facebook.com');

  useEffect(() => {
    const fetchPublicConfigs = async () => {
      try {
        const res = await fetch('/api/system-configs');
        if (res.ok) {
          const data: SystemConfigItem[] = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (item.key === 'HOTLINE' && item.value) setHotline(item.value);
              if (item.key === 'ZALO_URL' && item.value) setZaloUrl(item.value);
              if (item.key === 'FANPAGE_URL' && item.value) setFanpageUrl(item.value);
            });
          }
        }
      } catch (err) {
        // Fallback to default values
      }
    };
    fetchPublicConfigs();
  }, []);

  const cleanPhone = hotline.replace(/[^0-9+]/g, '');

  return (
    <aside aria-label="Kênh liên hệ nhanh" className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 font-sans select-none items-end">
      {/* 1. Hotline Floating Button */}
      <a
        href={`tel:${cleanPhone}`}
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-emerald-400/30 animate-pulse"
        title={`Gọi Hotline: ${hotline}`}
      >
        <Phone className="w-5 h-5 fill-white animate-bounce" />
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
          <span>Hotline: {hotline}</span>
        </span>
      </a>

      {/* 2. Zalo Floating Button */}
      <a
        href={zaloUrl.startsWith('http') ? zaloUrl : `https://zalo.me/${zaloUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0068FF] text-white shadow-lg hover:bg-[#0054cc] hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-blue-400/30"
        title="Chat qua Zalo"
      >
        <span className="font-extrabold text-sm tracking-tighter">Zalo</span>
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1">
          <span>Chat Zalo tư vấn</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </span>
      </a>

      {/* 3. Facebook Fanpage / Messenger Button */}
      <a
        href={fanpageUrl.startsWith('http') ? fanpageUrl : `https://facebook.com/${fanpageUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#0084FF] to-[#00C6FF] text-white shadow-lg hover:opacity-90 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-sky-400/30"
        title="Nhắn tin Facebook Fanpage"
      >
        <Facebook className="w-5 h-5 fill-white" />
        
        {/* Tooltip */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1">
          <span>Fanpage Facebook</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </span>
      </a>
    </aside>
  );
};
