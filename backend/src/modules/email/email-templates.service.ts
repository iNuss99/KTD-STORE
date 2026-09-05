import { Injectable } from '@nestjs/common';
import {
  OrderConfirmationData,
  RefundConfirmationData,
  AbandonedCartData,
  WelcomeEmailData,
  PasswordResetEmailData,
  StaffCreatedEmailData,
  StaffStatusEmailData,
} from './email.types';

@Injectable()
export class EmailTemplatesService {
  private formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  private wrapBaseLayout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px 24px; }
    .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 14px; margin-top: 16px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { text-align: left; padding: 10px; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
    .table td { padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MENWEAR HUB</h1>
      <p>Phong Cách & Đẳng Cấp Thời Trang Nam</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Cảm ơn bạn đã tin tưởng và đồng hành cùng <strong>MenWear Hub</strong>.</p>
      <p>Hotline: 1900 8888 | Email: support@menwearhub.vn | Website: https://menwearhub.vn</p>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
    </div>
  </div>
</body>
</html>`;
  }

  generateOrderConfirmation(data: OrderConfirmationData): { subject: string; html: string } {
    const subject = `[MenWear Hub] Xác nhận đơn hàng #${data.orderNumber} thành công`;

    const itemsRows = data.items
      .map(
        (item) => `
        <tr>
          <td>
            <strong>${item.name}</strong><br>
            <span style="font-size: 12px; color: #64748b;">
              ${item.size ? `Size: ${item.size}` : ''} ${item.color ? ` | Màu: ${item.color}` : ''}
            </span>
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right; font-weight: 600;">${this.formatVND(item.price * item.quantity)}</td>
        </tr>`,
      )
      .join('');

    const address = data.shippingAddress;
    const fullAddress = [address.addressLine, address.ward, address.district, address.city]
      .filter(Boolean)
      .join(', ');

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge badge-success">ĐẶT HÀNG THÀNH CÔNG</span>
        <h2 style="margin: 12px 0 4px; color: #0f172a; font-size: 20px;">Cảm ơn bạn, ${data.customerName}!</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Đơn hàng <strong>#${data.orderNumber}</strong> của bạn đã được tiếp nhận và đang được đóng gói.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
        <p style="margin: 0 0 6px;"><strong>📍 Địa chỉ nhận hàng:</strong> ${address.receiverName} - ${address.phoneNumber}</p>
        <p style="margin: 0 0 6px; color: #475569;">${fullAddress}</p>
        <p style="margin: 0;"><strong>💳 Phương thức:</strong> ${data.paymentMethod}</p>
      </div>

      <h3 style="font-size: 15px; margin: 0; color: #0f172a;">Chi tiết sản phẩm</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th style="text-align: center;">SL</th>
            <th style="text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="border-top: 2px solid #e2e8f0; padding-top: 14px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #64748b;">Tạm tính:</span>
          <strong>${this.formatVND(data.subtotal)}</strong>
        </div>
        ${
          data.discountAmount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #dc2626;">
                <span>Giảm giá voucher:</span>
                <strong>-${this.formatVND(data.discountAmount)}</strong>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #64748b;">Phí vận chuyển:</span>
          <strong>${data.shippingFee === 0 ? 'Miễn phí' : this.formatVND(data.shippingFee)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 18px; color: #4f46e5; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          <span>Tổng thanh toán:</span>
          <strong style="color: #4f46e5;">${this.formatVND(data.total)}</strong>
        </div>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${data.trackingUrl || `http://localhost:5173/orders/${data.orderId}`}" class="btn">
          🔍 Theo Dõi Tiến Độ Đơn Hàng
        </a>
      </div>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generateRefundConfirmation(data: RefundConfirmationData): { subject: string; html: string } {
    const subject = `[MenWear Hub] Xác nhận hoàn tiền đơn hàng #${data.orderNumber}`;

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge badge-warning">XÁC NHẬN HOÀN TIỀN</span>
        <h2 style="margin: 12px 0 4px; color: #0f172a; font-size: 20px;">Yêu cầu hoàn tiền đã được xử lý</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Chào <strong>${data.customerName}</strong>, chúng tôi đã hoàn tất thủ tục hoàn tiền cho bạn.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 8px;"><strong>Mã đơn hàng:</strong> #${data.orderNumber}</p>
        <p style="margin: 0 0 8px;"><strong>Lý do:</strong> ${data.reason}</p>
        <p style="margin: 0 0 8px;"><strong>Hình thức hoàn:</strong> ${data.refundMethod}</p>
        <p style="margin: 0 0 8px;"><strong>Thời gian xử lý:</strong> ${data.processedDate}</p>
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 18px; color: #16a34a;">
          <strong>Số tiền hoàn lại: ${this.formatVND(data.refundAmount)}</strong>
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5;">
        *Lưu ý: Tùy theo ngân hàng thụ hưởng hoặc ví điện tử, số tiền hoàn có thể mất từ 1-3 ngày làm việc để hiển thị trong tài khoản của bạn.
      </p>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generateAbandonedCartReminder(data: AbandonedCartData): { subject: string; html: string } {
    const subject = `[MenWear Hub] Bạn còn để quên giỏ hàng chưa thanh toán! 🎁 Tặng bạn mã giảm 5%`;

    const itemsList = data.items
      .map(
        (item) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="flex: 1;">
            <strong style="color: #0f172a; font-size: 14px;">${item.name}</strong>
            <div style="color: #64748b; font-size: 13px;">SL: ${item.quantity} x ${this.formatVND(item.price)}</div>
          </div>
          <strong style="color: #4f46e5;">${this.formatVND(item.price * item.quantity)}</strong>
        </div>`,
      )
      .join('');

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 20px;">Đừng để lỡ sản phẩm bạn yêu thích!</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Chào <strong>${data.customerName}</strong>, chúng tôi nhận thấy bạn vẫn còn các món đồ thời trang tuyệt vời trong giỏ hàng.</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase;">Sản phẩm trong giỏ:</h4>
        ${itemsList}
        <div style="text-align: right; margin-top: 12px; font-size: 16px;">
          Tổng cộng: <strong style="color: #0f172a;">${this.formatVND(data.totalAmount)}</strong>
        </div>
      </div>

      <div style="background: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #4338ca; font-weight: 600;">MÃ GIẢM GIÁ ĐỘC QUYỀN DÀNH RIÊNG CHO BẠN:</p>
        <span style="font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: 2px;">${data.discountCode || 'COMEBACK5'}</span>
        <p style="margin: 6px 0 0; font-size: 12px; color: #6366f1;">(Giảm thêm 5% cho đơn hàng hoàn tất hôm nay)</p>
      </div>

      <div style="text-align: center;">
        <a href="${data.recoveryUrl}" class="btn">
          ⚡ Hoàn Tất Đơn Hàng Ngay
        </a>
      </div>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
    const subject = `[MenWear Hub] Chào mừng bạn gia nhập gia đình MenWear Hub! 🎉`;

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 22px;">Chào mừng ${data.customerName}!</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Cảm ơn bạn đã đăng ký tài khoản thành viên tại <strong>MenWear Hub</strong>.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 10px; font-size: 14px; color: #334155;">Món quà đặc biệt dành tặng bạn cho đơn hàng đầu tiên:</p>
        <div style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 8px 18px; border-radius: 8px; font-size: 18px; font-weight: 800; letter-spacing: 2px;">
          ${data.welcomeVoucherCode || 'HELLOMENWEAR'}
        </div>
        <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">(Giảm ngay 10% áp dụng cho toàn bộ danh mục sản phẩm mới)</p>
      </div>

      <div style="text-align: center;">
        <a href="${data.shopUrl || 'http://localhost:5173/products'}" class="btn">
          🛍️ Khám Phá Bộ Sưu Tập Mới
        </a>
      </div>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generatePasswordReset(data: PasswordResetEmailData): { subject: string; html: string } {
    const subject = `[MenWear Hub] Yêu cầu đặt lại mật khẩu`;

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 20px;">Yêu cầu đổi mật khẩu</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Chào <strong>${data.customerName}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      </div>

      ${
        data.otpCode
          ? `<div style="text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">Mã OTP bảo mật của bạn là:</p>
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; background: #eef2ff; padding: 8px 24px; border-radius: 12px; display: inline-block;">
                ${data.otpCode}
              </span>
              <p style="margin: 8px 0 0; font-size: 12px; color: #ef4444;">Mã có hiệu lực trong vòng ${data.expiresInMinutes} phút.</p>
            </div>`
          : ''
      }

      <div style="text-align: center; margin-top: 24px;">
        <a href="${data.resetUrl}" class="btn">
          🔒 Đặt Lại Mật Khẩu
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hotline để được hỗ trợ bảo vệ tài khoản.
      </p>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generateStaffWelcomeEmail(data: StaffCreatedEmailData): { subject: string; html: string } {
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Quản trị viên cấp cao (Super Admin)',
      CEO: 'Ban Giám Đốc (CEO)',
      MANAGER: 'Quản lý (Manager)',
      STAFF: 'Nhân viên vận hành (Staff)',
    };
    const roleLabel = roleLabels[data.role] || data.role;

    const subject = `[KTD Store] Thông tin tài khoản nhân sự mới - Chào mừng ${data.staffName}`;

    const htmlContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge badge-success">CHÀO MỪNG NHÂN SỰ MỚI</span>
        <h2 style="margin: 12px 0 6px; color: #0f172a; font-size: 22px;">Chào mừng ${data.staffName}!</h2>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Tài khoản làm việc của bạn trên hệ thống <strong>KTD Store</strong> đã được kích hoạt thành công.</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 14px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Thông tin đăng nhập của bạn:
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Họ và tên:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${data.staffName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Email đăng nhập:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${data.staffEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Mật khẩu ban đầu:</td>
            <td style="padding: 6px 0;">
              <code style="background: #eef2ff; color: #4f46e5; padding: 3px 8px; border-radius: 6px; font-size: 15px; font-weight: bold; font-family: monospace;">
                ${data.initialPassword || '(Đã được thiết lập)'}
              </code>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Vai trò / Chức vụ:</td>
            <td style="padding: 6px 0;">
              <span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                ${roleLabel}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${data.loginUrl}" class="btn" style="background: #d97706; text-decoration: none;">
          🔑 Đăng Nhập Trang Quản Trị
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px 18px; margin-top: 20px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>🔒 Lưu ý bảo mật:</strong> Để bảo vệ tài khoản và dữ liệu hệ thống, vui lòng đổi lại mật khẩu cá nhân ngay sau lần đăng nhập đầu tiên. Tuyệt đối không chia sẻ thông tin đăng nhập này cho bất kỳ ai.
        </p>
      </div>
    `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }

  generateStaffStatusEmail(data: StaffStatusEmailData): { subject: string; html: string } {
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Quản trị viên cấp cao (Super Admin)',
      CEO: 'Ban Giám Đốc (CEO)',
      MANAGER: 'Quản lý (Manager)',
      STAFF: 'Nhân viên vận hành (Staff)',
    };
    const roleLabel = roleLabels[data.role] || data.role;

    const isLocked = data.isLocked;
    const subject = isLocked
      ? `[KTD Store] Thông báo: Tài khoản của bạn đã bị tạm khóa`
      : `[KTD Store] Thông báo: Tài khoản của bạn đã được mở khóa hoạt động`;

    const htmlContent = isLocked
      ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <span class="badge" style="background: #fee2e2; color: #dc2626; padding: 4px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px;">
            🔒 TÀI KHOẢN TẠM KHÓA
          </span>
          <h2 style="margin: 14px 0 6px; color: #0f172a; font-size: 22px;">Thông báo tạm khóa tài khoản</h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Kính gửi <strong>${data.staffName}</strong>,</p>
        </div>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 10px; font-size: 14px; color: #991b1b; line-height: 1.6;">
            Tài khoản nhân sự của bạn trên hệ thống <strong>KTD Store</strong> đã được chuyển sang trạng thái <strong>TẠM KHÓA</strong> vào lúc <strong>${data.updatedAt}</strong>.
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #b91c1c; line-height: 1.6;">
            <li>Email tài khoản: <strong>${data.staffEmail}</strong></li>
            <li>Vai trò: <strong>${roleLabel}</strong></li>
            <li>Quyền hạn: Tạm ngưng quyền truy cập cổng quản trị và các tác vụ nội bộ.</li>
          </ul>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 20px; font-size: 13px; color: #475569;">
          <p style="margin: 0;">
            Nếu bạn cho rằng đây là sự nhầm lẫn hoặc cần mở lại quyền truy cập, vui lòng liên hệ trực tiếp với <strong>Ban Giám Đốc / Super Admin</strong> của KTD Store qua email hoặc hotline công ty để được giải quyết.
          </p>
        </div>
      `
      : `
        <div style="text-align: center; margin-bottom: 24px;">
          <span class="badge" style="background: #dcfce7; color: #16a34a; padding: 4px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px;">
            🔓 TÀI KHOẢN ĐÃ MỞ KHÓA
          </span>
          <h2 style="margin: 14px 0 6px; color: #0f172a; font-size: 22px;">Tài khoản đã được mở khóa!</h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Kính gửi <strong>${data.staffName}</strong>,</p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 10px; font-size: 14px; color: #166534; line-height: 1.6;">
            Tài khoản nhân sự của bạn (<strong>${data.staffEmail}</strong> - ${roleLabel}) đã được Quản trị viên <strong>MỞ KHÓA THÀNH CÔNG</strong> vào lúc <strong>${data.updatedAt}</strong>.
          </p>
          <p style="margin: 0; font-size: 13px; color: #15803d;">
            Bạn hiện có thể tiếp tục đăng nhập và thực hiện công việc bình thường trên hệ thống quản trị KTD Store.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${data.loginUrl || 'http://localhost:5173/admin/login'}" class="btn" style="background: #16a34a; text-decoration: none;">
            🔑 Đăng Nhập Hệ Thống Ngay
          </a>
        </div>
      `;

    return {
      subject,
      html: this.wrapBaseLayout(subject, htmlContent),
    };
  }
}

