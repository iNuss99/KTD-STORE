import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle, Loader2, Phone, MessageCircle, Check, Copy, X, ExternalLink, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

interface SandboxPaymentModalProps {
  orderId: string;
  totalAmount: number;
  paymentMethod: 'VNPAY' | 'MOMO';
  onSuccess: () => void;
  onCancel: () => void;
  onContinueShopping?: () => void;
}

export const SandboxPaymentModal: React.FC<SandboxPaymentModalProps> = ({
  orderId,
  totalAmount,
  paymentMethod,
  onSuccess,
  onCancel,
  onContinueShopping,
}) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedField, setCopiedField] = useState<'accountNo' | 'content' | null>(null);
  const { formatPrice } = useLanguage();
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [bankCode, setBankCode] = useState('MB');
  const [bankName, setBankName] = useState('MBBank (Ngân hàng Quân Đội)');
  const [bankAccountNo, setBankAccountNo] = useState('999988888');
  const [bankAccountName, setBankAccountName] = useState('KTDL');

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

  // Auto-poll PayOS API + Order status every 1.5s to detect real bank transfer automatically
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
              'Thanh toán thành công!',
              'Hệ thống đã nhận được tiền và tự động duyệt đơn hàng của bạn.',
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
              'Thanh toán thành công!',
              'Hệ thống đã nhận tiền từ ngân hàng và duyệt đơn tự động.',
            );
            onSuccessRef.current();
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    };

    const intervalId = setInterval(checkStatus, 1500);
    return () => clearInterval(intervalId);
  }, [orderId]);

  const shortId = orderId ? orderId.slice(0, 8) : '';
  const transferContent = `KTD ${shortId}`.toUpperCase();

  const handleCopy = (text: string, field: 'accountNo' | 'content', successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showSuccess('Đã sao chép', successMsg);
    setTimeout(() => {
      setCopiedField((prev) => (prev === field ? null : prev));
    }, 2000);
  };

  const handleCheckPayment = async () => {
    setProcessing(true);
    try {
      // 1. Query PayOS directly to verify real bank transaction
      const orderCode = payosLinkRef.current?.orderCode;
      const payosUrl = orderCode
        ? `/api/payments/payos/check-status/${orderId}?orderCode=${orderCode}`
        : `/api/payments/payos/check-status/${orderId}`;

      const payosRes = await fetch(payosUrl, { headers: getAuthHeader() });
      if (payosRes.ok) {
        const payosData = await payosRes.json();
        if (payosData.isPaid) {
          showSuccess(
            'Thanh toán thành công!',
            'Hệ thống đã nhận được tiền từ ngân hàng và xác nhận đơn hàng.',
          );
          onSuccess();
          return;
        }
      }

      // 2. Query order status in DB (e.g. if webhook already processed it)
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
          showSuccess(
            'Thanh toán thành công!',
            'Hệ thống đã nhận được tiền từ ngân hàng và xác nhận đơn hàng.',
          );
          onSuccess();
          return;
        }
      }

      // STRICT REFUSAL: Bank has not confirmed money into the account
      showWarning(
        'Chưa ghi nhận thanh toán',
        'Tài khoản ngân hàng chưa nhận được tiền cho đơn hàng này. Quý khách vui lòng quét mã QR chuyển khoản, hệ thống sẽ tự động xác nhận ngay khi tiền vào.',
      );
    } catch {
      showWarning(
        'Chưa ghi nhận thanh toán',
        'Tài khoản ngân hàng chưa nhận được tiền cho đơn hàng này. Quý khách vui lòng quét mã QR chuyển khoản, hệ thống sẽ tự động xác nhận ngay khi tiền vào.',
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      navigate('/products');
    }
  };

  const effectiveAmount = payosLink?.amount || totalAmount;
  const effectiveTransferContent = payosLink?.description || transferContent;
  const effectiveBankCode = payosLink?.bin === '970422' ? 'MB' : bankCode;
  const effectiveAccountNo = payosLink?.accountNumber || bankAccountNo;
  const effectiveAccountName = payosLink?.accountName || bankAccountName;

  const qrImageUrl = `https://img.vietqr.io/image/${effectiveBankCode}-${effectiveAccountNo}-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(effectiveTransferContent)}&accountName=${encodeURIComponent(effectiveAccountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-sans select-none overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                Thanh toán chuyển khoản QR
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mã đơn: <span className="font-mono font-bold text-slate-700">#{orderId.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Tự động xác nhận
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Column Layout with Extra Large QR */}
        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6 bg-slate-50/50">
          {/* Left: QR Code Box */}
          <div className="flex flex-col items-center justify-center md:w-[260px] shrink-0">
            <div className="w-60 h-60 sm:w-64 sm:h-64 bg-white rounded-2xl p-3 flex items-center justify-center relative shadow-sm border border-slate-200/80 overflow-hidden">
              {loadingPayos ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  <span className="text-xs font-medium">Đang tạo mã QR...</span>
                </div>
              ) : (
                <img
                  src={qrImageUrl}
                  alt="VietQR Payment Code"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=STK:${effectiveAccountNo}_NH:${effectiveBankCode}_ND:${encodeURIComponent(effectiveTransferContent)}_SOTIEN:${effectiveAmount}`;
                  }}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2.5 font-medium flex items-center justify-center gap-1.5 flex-wrap">
              <span>Quét mã bằng app ngân hàng bất kỳ</span>
              {payosLink?.checkoutUrl && (
                <a
                  href={payosLink.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 hover:underline font-bold inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Mở link
                </a>
              )}
            </p>
          </div>

          {/* Right: Transfer details */}
          <div className="flex-1 w-full flex flex-col justify-between space-y-3">
            {/* Amount Box */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Số tiền thanh toán
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Chính xác từng đồng
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-600 tracking-tight">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Bank details cards */}
            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs overflow-hidden text-xs">
              {/* Ngân hàng */}
              <div className="flex justify-between items-center px-3.5 py-2.5">
                <span className="text-slate-500 font-medium">Ngân hàng</span>
                <span className="font-bold text-slate-800 text-right">{bankName}</span>
              </div>

              {/* Số tài khoản */}
              <div className="flex justify-between items-center px-3.5 py-2.5">
                <span className="text-slate-500 font-medium">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-slate-900 text-sm tracking-wide">
                    {effectiveAccountNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(effectiveAccountNo, 'accountNo', 'Đã sao chép số tài khoản.')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      copiedField === 'accountNo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {copiedField === 'accountNo' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        Chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex justify-between items-center px-3.5 py-2.5">
                <span className="text-slate-500 font-medium">Chủ tài khoản</span>
                <span className="font-mono font-bold text-slate-800 uppercase">{effectiveAccountName}</span>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="flex justify-between items-center px-3.5 py-2.5 bg-amber-50/40">
                <div>
                  <span className="text-slate-500 font-medium block">Nội dung CK</span>
                  <span className="text-[10px] text-amber-700 font-semibold">(Bắt buộc giữ nguyên)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-700 text-sm tracking-wider">
                    {effectiveTransferContent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(effectiveTransferContent, 'content', 'Đã sao chép nội dung chuyển khoản.')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      copiedField === 'content'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100/90 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {copiedField === 'content' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-amber-700" />
                        Chép
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Friendly guidance notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping shrink-0 mt-1.5" />
              <p className="text-[11.5px] leading-relaxed font-medium">
                Mở ứng dụng Ngân hàng quét mã QR để thanh toán. Hệ thống sẽ <b>tự động xác nhận</b> ngay khi chuyển tiền thành công.
              </p>
            </div>

            {/* 60s Lag/Delay Fallback Banner */}
            {elapsedSeconds >= 60 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-snug">
                    <span className="font-bold">Bạn đã chuyển tiền nhưng chưa thấy chuyển trang?</span>
                    <p className="text-amber-800 text-[10.5px] mt-0.5">
                      Đừng lo lắng, tiền của bạn hoàn toàn an toàn! Vui lòng liên hệ shop để hỗ trợ kiểm tra đơn ngay:
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="https://zalo.me/0931143830"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      navigator.clipboard.writeText(`Đơn hàng #${orderId.slice(0, 8).toUpperCase()}`);
                      showSuccess('Đã chép mã đơn', 'Đã sao chép mã đơn vào khay nhớ tạm để gửi Zalo.');
                    }}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Nhắn Zalo hỗ trợ</span>
                  </a>
                  <a
                    href="tel:0931143830"
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi 0931.143.830</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={processing}
            onClick={handleContinueShopping}
            className="w-full sm:w-auto py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            Tiếp tục mua sắm
          </button>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <span>Đang chờ thanh toán ({elapsedSeconds}s)...</span>
            </div>
            <button
              type="button"
              disabled={processing}
              onClick={handleCheckPayment}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {processing ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
