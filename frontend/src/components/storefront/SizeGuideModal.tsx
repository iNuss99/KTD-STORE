import React from 'react';
import { X, Ruler, CheckCircle } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-line rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-ink-soft hover:text-ink bg-bg-alt rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-ink">Bảng Hướng Dẫn Chọn Size Chuẩn</h3>
            <p className="text-xs text-ink-soft mt-0.5">Dành cho các dòng sản phẩm Áo & Quần tại Knot To Detail</p>
          </div>
        </div>

        {/* Tops Size Table (Áo polo, sơ mi, thun) */}
        <div className="space-y-3">
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">1. Bảng Size Áo (Polo, Sơ Mi, Áo Thun)</h4>
          <div className="border border-line rounded-2xl overflow-hidden font-sans text-xs">
            <table className="w-full text-left">
              <thead className="bg-bg-alt border-b border-line text-ink-soft uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Chiều cao (cm)</th>
                  <th className="p-3">Cân nặng (kg)</th>
                  <th className="p-3">Vòng ngực (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                <tr className="hover:bg-bg-alt/50 transition">
                  <td className="p-3 font-bold text-accent">S</td>
                  <td className="p-3">158 - 165</td>
                  <td className="p-3">50 - 58</td>
                  <td className="p-3">86 - 90</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition bg-bg-alt/20">
                  <td className="p-3 font-bold text-accent">M</td>
                  <td className="p-3">165 - 172</td>
                  <td className="p-3">58 - 66</td>
                  <td className="p-3">91 - 95</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition">
                  <td className="p-3 font-bold text-accent">L</td>
                  <td className="p-3">170 - 177</td>
                  <td className="p-3">66 - 74</td>
                  <td className="p-3">96 - 100</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition bg-bg-alt/20">
                  <td className="p-3 font-bold text-accent">XL</td>
                  <td className="p-3">175 - 182</td>
                  <td className="p-3">74 - 82</td>
                  <td className="p-3">101 - 106</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition">
                  <td className="p-3 font-bold text-accent">XXL</td>
                  <td className="p-3">180 - 188</td>
                  <td className="p-3">82 - 92</td>
                  <td className="p-3">107 - 114</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pants Size Table */}
        <div className="space-y-3">
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">2. Bảng Size Quần (Jeans, Kaki, Quần Tây)</h4>
          <div className="border border-line rounded-2xl overflow-hidden font-sans text-xs">
            <table className="w-full text-left">
              <thead className="bg-bg-alt border-b border-line text-ink-soft uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Vòng eo (cm)</th>
                  <th className="p-3">Vòng mông (cm)</th>
                  <th className="p-3">Dài quần (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                <tr className="hover:bg-bg-alt/50 transition">
                  <td className="p-3 font-bold text-accent">29 (S)</td>
                  <td className="p-3">74 - 76</td>
                  <td className="p-3">90 - 92</td>
                  <td className="p-3">96</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition bg-bg-alt/20">
                  <td className="p-3 font-bold text-accent">30 (M)</td>
                  <td className="p-3">77 - 79</td>
                  <td className="p-3">93 - 95</td>
                  <td className="p-3">98</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition">
                  <td className="p-3 font-bold text-accent">31 - 32 (L)</td>
                  <td className="p-3">80 - 84</td>
                  <td className="p-3">96 - 100</td>
                  <td className="p-3">100</td>
                </tr>
                <tr className="hover:bg-bg-alt/50 transition bg-bg-alt/20">
                  <td className="p-3 font-bold text-accent">33 - 34 (XL)</td>
                  <td className="p-3">85 - 89</td>
                  <td className="p-3">101 - 105</td>
                  <td className="p-3">102</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-bg-alt p-4 rounded-2xl border border-line space-y-2 text-xs text-ink-soft">
          <p className="font-bold text-ink flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-ok" /> Mẹo chọn size chính xác:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Nếu số đo của bạn nằm giữa 2 size, hãy ưu tiên chọn size lớn hơn để thoải mái cử động.</li>
            <li>Knot To Detail hỗ trợ đổi size miễn phí trong vòng 7 ngày nếu không vừa vặn.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-accent hover:bg-accent-dark text-white font-sans text-xs font-bold uppercase tracking-wider rounded-full transition shadow-xs"
        >
          Đã hiểu & Tiếp tục mua sắm
        </button>
      </div>
    </div>
  );
};
