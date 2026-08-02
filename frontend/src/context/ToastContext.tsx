import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, ShieldAlert, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, onConfirm?: () => void) => void;
  showSuccess: (title: string, message?: string, onConfirm?: () => void) => void;
  showError: (title: string, message?: string, onConfirm?: () => void) => void;
  showInfo: (title: string, message?: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message?: string, onConfirm?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ToastConfig | null>(null);

  const showToast = (type: ToastType, title: string, message: string = '', onConfirm?: () => void) => {
    setActiveModal({
      id: String(Date.now()),
      type,
      title,
      message,
      onConfirm,
    });
  };

  const showSuccess = (title: string, message: string = '', onConfirm?: () => void) => showToast('success', title, message, onConfirm);
  const showError = (title: string, message: string = '', onConfirm?: () => void) => showToast('error', title, message, onConfirm);
  const showInfo = (title: string, message: string = '', onConfirm?: () => void) => showToast('info', title, message, onConfirm);
  const showWarning = (title: string, message: string = '', onConfirm?: () => void) => showToast('warning', title, message, onConfirm);

  const handleClose = () => {
    if (activeModal?.onConfirm) {
      activeModal.onConfirm();
    }
    setActiveModal(null);
  };

  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bgIcon: 'bg-emerald-100 text-emerald-600',
          borderColor: 'border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
          icon: <CheckCircle2 className="w-9 h-9 text-emerald-600" />,
          defaultTitle: 'Thành công',
        };
      case 'error':
        return {
          bgIcon: 'bg-rose-100 text-rose-600',
          borderColor: 'border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
          icon: <AlertCircle className="w-9 h-9 text-rose-600" />,
          defaultTitle: 'Đã xảy ra lỗi',
        };
      case 'warning':
        return {
          bgIcon: 'bg-amber-100 text-amber-600',
          borderColor: 'border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          icon: <ShieldAlert className="w-9 h-9 text-amber-600" />,
          defaultTitle: 'Cảnh báo',
        };
      case 'info':
      default:
        return {
          bgIcon: 'bg-sky-100 text-sky-600',
          borderColor: 'border-sky-200',
          btnBg: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200',
          icon: <Info className="w-9 h-9 text-sky-600" />,
          defaultTitle: 'Thông báo',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}

      {/* Global Status Pop-up Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 relative animate-in zoom-in-95 duration-200 space-y-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Circle */}
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${getTheme(activeModal.type).bgIcon}`}>
              {getTheme(activeModal.type).icon}
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                {activeModal.title || getTheme(activeModal.type).defaultTitle}
              </h3>
              {activeModal.message && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-[280px] mx-auto">
                  {activeModal.message}
                </p>
              )}
            </div>

            {/* Confirm Button */}
            <div className="pt-2">
              <button
                onClick={handleClose}
                className={`w-full py-3 px-5 rounded-2xl font-bold text-xs shadow-md transition ${getTheme(activeModal.type).btnBg}`}
              >
                Đồng ý / Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
