import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: any;
  let gateway: any;

  beforeEach(async () => {
    notifRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((n) => Promise.resolve({ id: 'notif-1', ...n, created_at: new Date() })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: '1', content: 'Test 1', is_read: false },
          { id: '2', content: 'Test 2', is_read: true },
        ]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(true),
      })),
    };

    gateway = {
      sendToRole: jest.fn(),
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notifRepo },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should handle order.created event and send notification to MANAGER', async () => {
    await service.handleOrderCreatedEvent({ orderId: 'ord-12345678', total: 500000 });

    expect(notifRepo.save).toHaveBeenCalled();
    expect(gateway.sendToRole).toHaveBeenCalledWith('MANAGER', 'notification', expect.any(Object));
  });

  it('should handle stock.low event and send notification to MANAGER', async () => {
    await service.handleStockLowEvent({ variantId: 'var-1', sku: 'SKU-123', remainingStock: 2 });

    expect(notifRepo.save).toHaveBeenCalled();
    expect(gateway.sendToRole).toHaveBeenCalledWith('MANAGER', 'notification', expect.any(Object));
  });

  it('should get user notifications and calculate unread count', async () => {
    const res = await service.getUserNotifications('user-1', 'CUSTOMER');

    expect(res.notifications.length).toBe(2);
    expect(res.unreadCount).toBe(1);
  });
});
