import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('ktd_pwa_dismissed');
    if (isDismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ktd_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <aside aria-label="Cài đặt ứng dụng" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-card border border-line rounded-3xl p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 font-sans">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-display text-sm font-bold text-ink">Cài đặt App MenWear Hub</h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Mượt mà
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Trải nghiệm mua sắm nhanh gấp 2 lần và nhận thông báo đơn hàng trực tiếp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-ink-soft hover:text-ink rounded-full bg-bg-alt"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 py-2.5 px-4 bg-accent hover:bg-accent-dark text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5" /> Cài đặt ngay
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="py-2.5 px-4 bg-bg-alt hover:bg-line/20 text-ink font-sans text-xs font-medium rounded-xl transition"
        >
          Để sau
        </button>
      </div>
    </aside>
  );
};
