/**
 * Centralized E-commerce Analytics Event Tracker
 * Supports Google Analytics 4 (gtag) and Meta Pixel (fbq)
 */

interface ProductEventItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}

export const analytics = {
  // Track product page view
  viewItem: (product: ProductEventItem) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_item', {
        currency: 'VND',
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
          },
        ],
      });
    }
  },

  // Track add to cart
  addToCart: (product: ProductEventItem) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'VND',
        value: product.price * (product.quantity || 1),
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            quantity: product.quantity || 1,
          },
        ],
      });
    }
  },

  // Track begin checkout
  beginCheckout: (total: number, itemsCount: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', {
        currency: 'VND',
        value: total,
        items_count: itemsCount,
      });
    }
  },

  // Track completed purchase
  purchase: (orderId: string, total: number, items: ProductEventItem[]) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: orderId,
        currency: 'VND',
        value: total,
        items: items.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity || 1,
        })),
      });
    }
  },
};
