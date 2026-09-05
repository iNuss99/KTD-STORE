import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, QrCode, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

interface SandboxPaymentModalProps {
  orderId: string;
  totalAmount: number;
  paymentMethod: 'VNPAY' | 'MOMO';
  onSuccess: () => void;
  onCancel: () => void;
}

export const SandboxPaymentModal: React.FC<SandboxPaymentModalProps> = ({
  orderId,
  totalAmount,
  paymentMethod,
  onSuccess,
  onCancel,
}) => {
  const [processing, setProcessing] = useState(false);
  const { formatPrice } = useLanguage();
  const { showSuccess, showError } = useToast();

  const [bankCode, setBankCode] = useState('MB');
  const [bankName, setBankName] = useState('MBBank (Ngân hàng Quân Đội)');
  const [bankAccountNo, setBankAccountNo] = useState('999988888');
  const [bankAccountName, setBankAccountName] = useState('KNOT TO DETAIL');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // PayOS Dynamic Link State
  const [payosLink, setPayosLink] = useState<{
    orderCode: number;
    checkoutUrl: string;
    qrCode: string;
    accountNumber: string;
    accountName: string;
    bin: string;
    amount: number;
    description: string;
  } | null>(null);
  const [loadingPayos, setLoadingPayos] = useState(false);
  const payosLinkRef = useRef(payosLink);
  useEffect(() => { payosLinkRef.current = payosLink; }, [payosLink]);

  useEffect(() => {
    const fetchBankConfigs = async () => {
      try {
        const res = await fetch('/api/system-configs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.key === 'BANK_CODE' && item.value) setBankCode(item.value);
              if (item.key === 'BANK_NAME' && item.value) setBankName(item.value);
              if (item.key === 'BANK_ACCOUNT_NO' && item.value) setBankAccountNo(item.value);
              if (item.key === 'BANK_ACCOUNT_NAME' && item.value) setBankAccountName(item.value);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching bank configs:', err);
      }
    };

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          const name = data.address?.full_name || data.user?.full_name || '';
          const phone = data.address?.phone || data.user?.phone || '';
          setCustomerName(name);
          setCustomerPhone(phone);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      }
    };

    const initPayosLink = async () => {
      setLoadingPayos(true);
      try {
        const res = await fetch('/api/payments/payos/create-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ orderId }),
        });
        if (res.ok) {
          const data = await res.json();
          setPayosLink(data);
          if (data.accountNumber) setBankAccountNo(data.accountNumber);
          if (data.accountName) setBankAccountName(data.accountName);
          if (data.bin === '970422') {
            setBankCode('MB');
            setBankName('MBBank (Ngân hàng Quân Đội)');
          }
        }
      } catch (err) {
        console.error('Error initializing PayOS payment link:', err);
      } finally {
        setLoadingPayos(false);
      }
    };

    fetchBankConfigs();
    if (orderId) {
      fetchOrderDetails();
      initPayosLink();
    }
  }, [orderId]);

  // Stable refs so the polling interval never captures stale closures
  const onSuccessRef = useRef(onSuccess);
  const showSuccessRef = useRef(showSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { showSuccessRef.current = showSuccess; }, [showSuccess]);

  // Auto-poll PayOS API + Order status every 2.5s to detect real bank transfer automatically
  useEffect(() => {
    if (!orderId) return;

    const calledRef = { current: false };

    const checkStatus = async () => {
      if (calledRef.current) return;
      try {
        // 1. Check PayOS direct API (instant auto-confirmation even on localhost)
        const orderCode = payosLinkRef.current?.orderCode;
        const payosUrl = orderCode
          ? `/api/payments/payos/check-status/${orderId}?orderCode=${orderCode}`
          : `/api/payments/payos/check-status/${orderId}`;
        
        const payosRes = await fetch(payosUrl, { headers: getAuthHeader() });
        if (payosRes.ok) {
          const payosData = await payosRes.json();
          if (payosData.isPaid) {
            calledRef.current = true;
            showSuccessRef.current(
              'Tự động xác nhận thành công!',
              'PayOS đã nhận tiền từ Ngân hàng và tự động duyệt đơn hàng của bạn.',
            );
            onSuccessRef.current();
            return;
          }
        }

        // 2. Fallback check order entity status (e.g. if Webhook triggered first)
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          const isPaid =
            data.status === 'PROCESSING' ||
            data.status === 'CONFIRMED' ||
            data.status === 'COMPLETED' ||
            data.payments?.some((p: any) => p.status === 'COMPLETED');

          if (isPaid) {
            calledRef.current = true;
            showSuccessRef.current(
              'Tự động xác nhận thành công!',
              'Hệ thống đã nhận tiền từ Ngân hàng và duyệt đơn tự động.',
            );
            onSuccessRef.current();
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    };

    const intervalId = setInterval(checkStatus, 2500);
    return () => clearInterval(intervalId);
  }, [orderId]);

  const removeAccents = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase();
  };

  const shortId = orderId ? orderId.slice(0, 8) : '';
  const transferContent = `KTD ${shortId}`.toUpperCase();

  const isVnpay = paymentMethod === 'VNPAY';

  const handleSimulate = async (action: 'SUCCESS' | 'CANCEL') => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/sandbox-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Xử lý thanh toán sandbox thất bại');
      }

      if (action === 'SUCCESS') {
        onSuccess();
      } else {
        onCancel();
      }
    } catch (err: any) {
      showError('Lỗi thanh toán', err.message || 'Không thể xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const effectiveAmount = payosLink?.amount || totalAmount;
  const effectiveTransferContent = payosLink?.description || transferContent;
  const effectiveBankCode = payosLink?.bin === '970422' ? 'MB' : bankCode;
  const effectiveAccountNo = payosLink?.accountNumber || bankAccountNo;
  const effectiveAccountName = payosLink?.accountName || bankAccountName;

  const qrImageUrl = `https://img.vietqr.io/image/${effectiveBankCode}-${effectiveAccountNo}-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(effectiveTransferContent)}&accountName=${encodeURIComponent(effectiveAccountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 font-sans select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`px-4 py-2.5 text-white flex items-center justify-between shrink-0 ${isVnpay ? 'bg-blue-700' : 'bg-pink-600'}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm sm:text-base">
              Cổng Thanh Toán Chuyển Khoản QR (Tự Động Duyệt)
            </h3>
          </div>
          <span className="text-[10px] sm:text-xs bg-emerald-500/80 px-2.5 py-0.5 rounded-full font-mono font-semibold text-white tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            PAYOS LIVE DETECT
          </span>
        </div>

        {/* Modal Body - 2 Column Layout with Extra Large QR */}
        <div className="p-4 sm:p-6 flex flex-col md:flex-row items-center gap-5 bg-slate-50/50">
          {/* Left: Extra Large VietQR Image */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="w-64 h-64 sm:w-80 sm:h-80 bg-white rounded-2xl p-3 flex items-center justify-center relative shadow-lg border-2 border-slate-200 overflow-hidden">
              {loadingPayos ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-mono">Đang tạo mã PayOS QR...</span>
                </div>
              ) : (
                <img
                  src={qrImageUrl}
                  alt="VietQR Payment Code"
                  className="w-full h-full object-contain transform scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=STK:${effectiveAccountNo}_NH:${effectiveBankCode}_ND:${encodeURIComponent(effectiveTransferContent)}_SOTIEN:${effectiveAmount}`;
                  }}
                />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center mt-2 flex items-center gap-2">
              <span>Mã đơn: #{orderId.slice(0, 8).toUpperCase()}</span>
              {payosLink?.checkoutUrl && (
                <a
                  href={payosLink.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  [Mở PayOS Checkout ↗]
                </a>
              )}
            </p>
          </div>

          {/* Right: Order & Bank Transfer Details */}
          <div className="flex-1 w-full space-y-2.5">
            {/* Amount Box */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-1 shadow-2xs">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Số tiền thanh toán</p>
                <p className="text-[11px] text-slate-500 font-mono">Đơn hàng: #{orderId.slice(0, 8)}</p>
              </div>
              <p className={`text-xl sm:text-2xl font-extrabold ${isVnpay ? 'text-blue-700' : 'text-pink-600'}`}>
                {formatPrice(totalAmount)}
              </p>
            </div>

            {/* Bank Details Table */}
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between items-center bg-white py-1.5 px-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium text-[11px]">Ngân hàng:</span>
                <span className="font-bold text-slate-800 text-xs">{bankName}</span>
              </div>
              <div className="flex justify-between items-center bg-white py-1.5 px-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium text-[11px]">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-slate-900 text-sm">{effectiveAccountNo}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(effectiveAccountNo);
                      showSuccess('Đã sao chép', 'Đã sao chép số tài khoản vào khay nhớ tạm.');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold transition"
                  >
                    Chép
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white py-1.5 px-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium text-[11px]">Chủ tài khoản:</span>
                <span className="font-mono font-bold text-slate-800 text-xs uppercase">{effectiveAccountName}</span>
              </div>
              <div className="flex justify-between items-center bg-white py-1.5 px-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium text-[11px]">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-blue-700 text-xs sm:text-sm">{effectiveTransferContent}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(effectiveTransferContent);
                      showSuccess('Đã sao chép', 'Đã sao chép nội dung chuyển khoản.');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold transition shrink-0"
                  >
                    Chép
                  </button>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-1.5 bg-emerald-50 p-2.5 rounded-lg text-emerald-900 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping shrink-0 mt-1"></span>
              <p className="text-[11px] leading-tight font-medium">
                <strong>Hệ thống PayOS đang tự động lắng nghe Ngân hàng...</strong> Quét mã QR bằng App Ngân hàng bất kỳ, ngay khi chuyển tiền thành công, hệ thống sẽ <b>tự động duyệt & chuyển trang</b> mà không cần bấm nút.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            disabled={processing}
            onClick={() => handleSimulate('CANCEL')}
            className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4 text-slate-500" />
            Hủy thanh toán
          </button>

          <button
            disabled={processing}
            onClick={() => handleSimulate('SUCCESS')}
            className={`flex-1 py-2 px-3 text-xs font-semibold text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5 ${
              isVnpay ? 'bg-blue-700 hover:bg-blue-800' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận thành công
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
