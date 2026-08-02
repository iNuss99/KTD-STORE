import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, X, Send, Sparkles, Loader2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProductItem {
  id: string;
  name: string;
  base_price: number;
  images?: { url: string }[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: ProductItem[];
}

export const AIChatWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useLanguage();

  // Hide AI Chat Widget on Login & Auth pages so it doesn't obscure forms
  const isAuthPage = ['/login', '/crm', '/customer/login', '/admin/login'].includes(location.pathname);
  if (isAuthPage) return null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào anh! Em là Trợ lý AI Stylist của Knot To Detail. Anh đang cần tư vấn phối đồ hay tìm sản phẩm gì hôm nay ạ?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
          products: data.suggested_products,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: 'Dạ hiện hệ thống đang bận một chút, anh thử lại giúp em nhé!',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Không thể kết nối máy chủ tư vấn.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-sky-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-slate-700"
        >
          <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:text-white transition">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-tight pr-1">Trợ lý AI Stylist</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  AI Stylist Assistant <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </h4>
                <p className="text-[11px] text-slate-400">Tư vấn thời trang nam 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white font-medium rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none font-normal'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggested Products Render */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 w-full">
                    {msg.products.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.id}`}
                        onClick={() => setIsOpen(false)}
                        className="bg-white p-2 rounded-xl border border-slate-200 hover:border-sky-500 shadow-2xs transition block group"
                      >
                        <div className="w-full h-20 bg-slate-100 rounded-lg overflow-hidden mb-1.5">
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] font-bold text-sky-600 mt-0.5">{formatPrice(p.base_price)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-white p-2.5 rounded-2xl border border-slate-200 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> AI Stylist đang suy nghĩ...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Choice Chips */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSend('Tư vấn áo sơ mi công sở')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-semibold rounded-full shrink-0 transition"
            >
              👔 Sơ mi công sở
            </button>
            <button
              onClick={() => handleSend('Gợi ý quần kaki / jeans')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-semibold rounded-full shrink-0 transition"
            >
              👖 Quần nam đẹp
            </button>
            <button
              onClick={() => handleSend('Xem áo Polo năng động')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-semibold rounded-full shrink-0 transition"
            >
              👕 Áo Polo
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập nhu cầu phối đồ của anh..."
              className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-slate-900 hover:bg-sky-600 text-white rounded-xl transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
