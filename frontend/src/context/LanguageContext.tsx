import React, { createContext, useContext, useState } from 'react';

export type Language = 'vi' | 'en';
export type Currency = 'VND' | 'USD';

const translations: Record<Language, Record<string, string>> = {
  vi: {
    'nav.home': 'Trang chủ',
    'nav.products': 'Sản phẩm',
    'nav.wishlist': 'Yêu thích',
    'nav.cart': 'Giỏ hàng',
    'nav.orders': 'Đơn hàng',
    'nav.admin': 'Quản trị',
    'nav.login': 'Đăng nhập',
    'nav.logout': 'Đăng xuất',
    'catalog.title': 'Bộ Sưu Tập Thời Trang Nam',
    'product.add_to_cart': 'Thêm vào giỏ hàng',
    'product.buy_now': 'Mua ngay',
    'product.out_of_stock': 'Hết hàng',
    'checkout.title': 'Thanh Toán Đơn Hàng',
    'checkout.payment_method': 'Phương thức thanh toán',
    'payment.cod': 'Thanh toán khi nhận hàng (COD)',
    'payment.bank': 'Chuyển khoản ngân hàng',
    'payment.vnpay': 'Cổng VNPAY (ATM / QR Code)',
    'payment.momo': 'Ví điện tử MoMo',
    'common.total': 'Tổng tiền',
  },
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.wishlist': 'Wishlist',
    'nav.cart': 'Cart',
    'nav.orders': 'My Orders',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'catalog.title': 'Men Fashion Collection',
    'product.add_to_cart': 'Add to Cart',
    'product.buy_now': 'Buy Now',
    'product.out_of_stock': 'Out of Stock',
    'checkout.title': 'Checkout Order',
    'checkout.payment_method': 'Payment Method',
    'payment.cod': 'Cash on Delivery (COD)',
    'payment.bank': 'Bank Transfer',
    'payment.vnpay': 'VNPAY Gateway (ATM / QR)',
    'payment.momo': 'MoMo E-Wallet',
    'common.total': 'Total',
  },
};

interface LanguageContextType {
  lang: Language;
  currency: Currency;
  setLang: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amountInVnd: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('vi');
  const [currency, setCurrency] = useState<Currency>('VND');

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['vi']?.[key] || key;
  };

  const formatPrice = (amountInVnd: number): string => {
    if (isNaN(amountInVnd)) return '0 ₫';
    if (currency === 'USD') {
      const usdAmount = amountInVnd / 25000;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdAmount);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountInVnd);
  };

  return (
    <LanguageContext.Provider value={{ lang, currency, setLang, setCurrency, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
