import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(payload: { orderId: string; total: number; customerName?: string }) {
    const content = `Đơn hàng mới #${payload.orderId.substring(0, 8)} đã được khởi tạo (${payload.total.toLocaleString('vi-VN')}đ).`;
    
    // Create notifications for MANAGER and SUPER_ADMIN
    const notif = this.notificationRepository.create({
      target_role: 'MANAGER',
      type: 'ORDER_CREATED',
      content,
    });
    const saved = await this.notificationRepository.save(notif);

    this.notificationsGateway.sendToRole('MANAGER', 'notification', saved);
    this.notificationsGateway.sendToRole('SUPER_ADMIN', 'notification', saved);
    this.notificationsGateway.sendToRole('CEO', 'notification', saved);
  }

  @OnEvent('stock.low')
  async handleStockLowEvent(payload: { variantId: string; sku: string; remainingStock: number }) {
    const content = `Cảnh báo tồn kho thấp! Biến thể SKU: ${payload.sku} chỉ còn ${payload.remainingStock} sản phẩm.`;
    
    const notif = this.notificationRepository.create({
      target_role: 'MANAGER',
      type: 'LOW_STOCK',
      content,
    });
    const saved = await this.notificationRepository.save(notif);

    this.notificationsGateway.sendToRole('MANAGER', 'notification', saved);
    this.notificationsGateway.sendToRole('SUPER_ADMIN', 'notification', saved);
  }

  @OnEvent('return.requested')
  async handleReturnRequestedEvent(payload: { returnId: string; orderId: string; userId: string }) {
    const content = `Yêu cầu đổi trả mới cho đơn hàng #${payload.orderId.substring(0, 8)}.`;
    
    const notif = this.notificationRepository.create({
      target_role: 'MANAGER',
      type: 'RETURN_REQUESTED',
      content,
    });
    const saved = await this.notificationRepository.save(notif);

    this.notificationsGateway.sendToRole('MANAGER', 'notification', saved);
    this.notificationsGateway.sendToRole('SUPER_ADMIN', 'notification', saved);
  }

  @OnEvent('return.updated')
  async handleReturnUpdatedEvent(payload: { returnId: string; userId: string; status: string }) {
    const content = `Yêu cầu đổi trả #${payload.returnId.substring(0, 8)} của bạn đã cập nhật trạng thái: ${payload.status}.`;
    
    const notif = this.notificationRepository.create({
      user_id: payload.userId,
      type: 'RETURN_UPDATED',
      content,
    });
    const saved = await this.notificationRepository.save(notif);

    this.notificationsGateway.sendToUser(payload.userId, 'notification', saved);
  }

  async getUserNotifications(userId: string, role: string) {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .orWhere('n.target_role = :role', { role })
      .orderBy('n.created_at', 'DESC')
      .take(50);

    const notifications = await query.getMany();
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    const notif = await this.notificationRepository.findOne({ where: { id } });
    if (!notif) {
      throw new NotFoundException('Thông báo không tồn tại');
    }
    notif.is_read = true;
    return this.notificationRepository.save(notif);
  }

  async markAllAsRead(userId: string, role: string) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ is_read: true })
      .where('user_id = :userId OR target_role = :role', { userId, role })
      .execute();

    return { message: 'Đã đánh dấu tất cả là đã đọc' };
  }
}
