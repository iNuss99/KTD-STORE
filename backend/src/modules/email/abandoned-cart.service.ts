import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger('AbandonedCartService');

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Scans for carts inactive for more than 3 hours with items and triggers recovery emails
   */
  async scanAndDispatchAbandonedCarts(): Promise<{ scanned: number; dispatched: number }> {
    try {
      if (!this.dataSource.isInitialized) return { scanned: 0, dispatched: 0 };

      // Query carts updated more than 3 hours ago with items and active user email
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const abandonedCarts = await this.dataSource.query(
        `SELECT c.id as cart_id, c.user_id, u.email, u.full_name,
                json_agg(json_build_object(
                  'name', p.name,
                  'price', p.base_price,
                  'quantity', ci.quantity
                )) as items,
                SUM(p.base_price * ci.quantity) as total_amount
         FROM carts c
         JOIN users u ON u.id = c.user_id
         JOIN cart_items ci ON ci.cart_id = c.id
         JOIN product_variants pv ON pv.id = ci.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE c.updated_at < $1
         GROUP BY c.id, c.user_id, u.email, u.full_name
         LIMIT 50`,
        [threeHoursAgo],
      );

      let dispatched = 0;
      for (const cart of abandonedCarts) {
        if (!cart.email) continue;

        this.eventEmitter.emit('cart.abandoned', {
          customerName: cart.full_name || 'Khách hàng',
          customerEmail: cart.email,
          items: cart.items || [],
          totalAmount: Number(cart.total_amount || 0),
          recoveryUrl: `http://localhost:5173/cart?restore=${cart.cart_id}`,
          discountCode: 'COMEBACK5',
        });
        dispatched++;
      }

      this.logger.log(`Abandoned cart scan finished: ${dispatched} recovery emails queued.`);
      return { scanned: abandonedCarts.length, dispatched };
    } catch (err: any) {
      this.logger.error(`Error scanning abandoned carts: ${err.message}`);
      return { scanned: 0, dispatched: 0 };
    }
  }
}
