import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileText, ArrowRight, Sparkles, CheckCircle2, Award, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="bg-[#F5F2EE] text-[#1A1A1A] font-sans pb-24">
      {/* Editorial Page Header */}
      <section className="bg-[#1A1A1A] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#C8A96E]/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C8A96E_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-[#C8A96E]/50 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#C8A96E]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C8A96E] font-semibold">
              KTDL
            </span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F2EE]">
            Triết Lý Tinh Giản, <br />
            <span className="italic font-serif text-[#C8A96E]">
              Tinh Tế Trong Từng Đường Kim Mũi Chỉ
            </span>
          </h1>

          <p className="text-[#A3A3A3] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Hành trình kiến tạo chuẩn mực trang phục nam tối giản editorial — nơi sự chỉn chu được định nghĩa qua cấu trúc cắt may và cam kết minh bạch trọn vẹn.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-mono">
            <a
              href="#atelier"
              className="px-5 py-2.5 bg-white/10 hover:bg-[#C8A96E] hover:text-[#1A1A1A] transition text-white border border-white/20 uppercase tracking-widest"
            >
              Câu chuyện xưởng may
            </a>
            <a
              href="#privacy"
              className="px-5 py-2.5 bg-[#C8A96E] hover:bg-[#A38345] text-[#1A1A1A] font-bold transition uppercase tracking-widest shadow-sm"
            >
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </section>

      {/* Atelier Story Section */}
      <section id="atelier" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="font-mono text-xs font-semibold text-[#C8A96E] uppercase tracking-[0.25em] block">
              OUR KTDL HERITAGE
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight">
              Tôn vinh vóc dáng quý ông qua từng phom dáng chuẩn mực
            </h2>
            <p className="text-[#6E6E6E] text-sm sm:text-base leading-relaxed">
              KTDL ra đời từ niềm đam mê với nghệ thuật may đo bespoke và phong cách tối giản đương đại. Chúng tôi tin rằng một chiếc áo sơ mi hay polo hoàn hảo không cần họa tiết phô trương, mà nằm ở độ đứng của cổ áo, tỷ lệ vai thoải mái và chất liệu vải tự nhiên thượng hạng.
            </p>
            <p className="text-[#6E6E6E] text-sm sm:text-base leading-relaxed">
              Mỗi sản phẩm xuất xưởng đều trải qua quy trình kiểm soát chất lượng nghiêm ngặt bởi những người thợ may lành nghề với hơn 15 năm kinh nghiệm.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1A1A1A]/10">
              <div className="space-y-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#C8A96E]">100%</span>
                <p className="text-xs text-[#6E6E6E]">Chất liệu tự nhiên cao cấp (Linen, Supima Cotton, Silk Oxford)</p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#C8A96E]">30 Ngày</span>
                <p className="text-xs text-[#6E6E6E]">Đổi size tận nơi hoàn toàn miễn phí trên toàn quốc</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] bg-[#EFECE6] border border-[#1A1A1A]/10 p-3 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80"
                alt="KTDL Craftsmanship"
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 border border-[#1A1A1A]/10 shadow-lg max-w-xs hidden sm:block">
                <p className="font-editorial text-xs italic text-[#1A1A1A]">
                  "Sự hoàn mỹ không nằm ở chỗ không còn gì để thêm vào, mà là không còn gì để lược bớt."
                </p>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#C8A96E] block mt-1">
                  — KTDL Creative Director
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white border-y border-[#1A1A1A]/10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="font-mono text-xs font-semibold text-[#C8A96E] uppercase tracking-[0.25em]">
              GIÁ TRỊ CỐT LÕI
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-[#1A1A1A]">
              Cam Kết Vàng Từ KTDL
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-3">
              <Award className="w-8 h-8 text-[#C8A96E]" />
              <h3 className="font-editorial text-lg font-bold text-[#1A1A1A]">Tay Nghề Thượng Thừa</h3>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">
                Từng đường may kim đôi, khuy xà cừ tự nhiên và phần ve áo được xử lý form định hình tinh xảo không bai nhão sau giặt.
              </p>
            </div>

            <div className="p-6 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#C8A96E]" />
              <h3 className="font-editorial text-lg font-bold text-[#1A1A1A]">Bảo Mật Toàn Diện</h3>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">
                Áp dụng tiêu chuẩn bảo mật dữ liệu SSL hiện đại, thanh toán mã hóa qua cổng ngân hàng ủy quyền, minh bạch 100%.
              </p>
            </div>

            <div className="p-6 bg-[#F5F2EE] border border-[#1A1A1A]/10 space-y-3">
              <HeartHandshake className="w-8 h-8 text-[#C8A96E]" />
              <h3 className="font-editorial text-lg font-bold text-[#1A1A1A]">Chăm Sóc Chu Đáo</h3>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">
                Đội ngũ Stylist cá nhân hỗ trợ tư vấn phom dáng, phối màu và chính sách bảo hành trọn đời cho đường may cúc áo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy Detailed Section */}
      <section id="privacy" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#C8A96E]/40 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-[#C8A96E]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C8A96E]">
              DATA PROTECTION &amp; PRIVACY
            </span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
            Chính Sách Bảo Mật Quyền Riêng Tư
          </h2>
          <p className="text-xs font-mono text-[#6E6E6E] uppercase tracking-wider">
            CẬP NHẬT LẦN CUỐI: THÁNG 09/2026 — KTDL
          </p>
        </div>

        <div className="bg-white border border-[#1A1A1A]/10 p-6 sm:p-10 shadow-sm space-y-8 text-sm text-[#4A4A4A] leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">01.</span> Mục Đích Thu Thập Dữ Liệu
            </h3>
            <p>
              KTDL thu thập dữ liệu người dùng nhằm mục đích cung cấp trải nghiệm mua sắm cá nhân hóa, xử lý đơn đặt hàng và vận chuyển chính xác:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#6E6E6E]">
              <li>Họ và tên, số điện thoại liên lạc để xác nhận đơn hàng và điều phối giao hàng.</li>
              <li>Địa chỉ giao nhận hàng hóa chi tiết.</li>
              <li>Địa chỉ email để gửi hóa đơn điện tử, mã vận đơn và thông tin chăm sóc khách hàng.</li>
              <li>Lịch sử đơn hàng, số đo hoặc ghi chú chọn size để tư vấn phom dáng phù hợp nhất.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">02.</span> Phạm Vi Sử Dụng &amp; Bảo Mật Thông Tin
            </h3>
            <p>
              Thông tin cá nhân chỉ được sử dụng trong phạm vi nội bộ phục vụ quy trình bán hàng và chăm sóc người tiêu dùng:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#6E6E6E]">
              <li>Thông báo xác nhận thanh toán và tiến độ giao hàng từ đơn vị vận chuyển uy tín.</li>
              <li>Giải quyết các yêu cầu bảo hành, đổi size hoặc trả hàng trong vòng 30 ngày.</li>
              <li>Cung cấp thông tin chương trình tri ân dành riêng cho hội viên (khi có sự đồng ý của bạn).</li>
              <li>Hệ thống lưu trữ dữ liệu được bảo vệ bằng tường lửa nhiều lớp và mã hóa SSL 256-bit chuẩn quốc tế.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">03.</span> Cam Kết Bảo Mật Thanh Toán
            </h3>
            <p>
              KTDL tích hợp các cổng thanh toán ngân hàng chính thống (PayOS QR, VNPAY, Chuyển khoản trực tiếp):
            </p>
            <div className="p-4 bg-[#F5F2EE] border-l-2 border-[#C8A96E] text-xs text-[#1A1A1A] space-y-1">
              <p className="font-bold">Tuyệt đối an toàn dữ liệu tài chính:</p>
              <p>
                Website KHÔNG lưu trữ số tài khoản ngân hàng, mã OTP hoặc mã bí mật thẻ thanh toán của quý khách trên máy chủ. Toàn bộ giao dịch đều được mã hóa theo giao thức mã hóa ngân hàng chuẩn PCI-DSS.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">04.</span> Không Chia Sẻ Dữ Liệu Cho Bên Thứ Ba
            </h3>
            <p>
              Chúng tôi cam kết KHÔNG bán, cho thuê hay trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại ngoài phạm vi hỗ trợ giao nhận đơn hàng.
            </p>
            <p className="text-xs text-[#6E6E6E]">
              Trong trường hợp có yêu cầu từ cơ quan thực thi pháp luật có thẩm quyền theo quy định của pháp luật Việt Nam, KTDL sẽ hợp tác cung cấp thông tin theo đúng trình tự pháp lý.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">05.</span> Quyền Lợi Của Khách Hàng
            </h3>
            <p>
              Quý khách có toàn quyền kiểm tra, cập nhật, điều chỉnh hoặc yêu cầu hủy bỏ thông tin cá nhân của mình:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#6E6E6E]">
              <li>Chủ động đăng nhập và cập nhật địa chỉ giao hàng tại trang <Link to="/addresses" className="text-[#C8A96E] hover:underline font-bold">Sổ địa chỉ</Link>.</li>
              <li>Kiểm tra trạng thái các đơn hàng đã đặt tại <Link to="/my-orders" className="text-[#C8A96E] hover:underline font-bold">Đơn hàng của tôi</Link>.</li>
              <li>Yêu cầu xóa tài khoản hoặc trích xuất dữ liệu bằng cách liên hệ với chúng tôi qua email concierge@ktdl.com.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-3 pt-4 border-t border-[#1A1A1A]/10">
            <h3 className="font-editorial text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="text-[#C8A96E] font-mono text-base font-bold">06.</span> Đơn Vị Thu Thập &amp; Quản Lý Thông Tin
            </h3>
            <div className="text-xs text-[#6E6E6E] space-y-1 font-mono">
              <p className="text-sm font-bold text-[#1A1A1A]">KTDL</p>
              <p>Showroom: 123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh</p>
              <p>Hotline Hỗ Trợ: 1900 8888 (08:30 - 21:30 hàng ngày)</p>
              <p>Email Phản Hồi: concierge@ktdl.com</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1A1A1A] hover:bg-[#C8A96E] text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-md group"
          >
            KHÁM PHÁ BỘ SƯU TẬP KTDL
            <ArrowRight className="w-4 h-4 text-[#C8A96E] group-hover:text-white transition-colors" />
          </Link>
        </div>
      </section>
    </div>
  );
};
