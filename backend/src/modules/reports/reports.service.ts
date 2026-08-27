import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../orders/entities/payment.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { ReturnRequest } from '../returns/entities/return-request.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums/order.enum';
import { ReturnStatus } from '../../common/enums/return.enum';
import { UserRole } from '../../common/enums/role.enum';
import { ReportQueryDto, ReportPeriod } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ReturnRequest)
    private returnRepo: Repository<ReturnRequest>,
  ) {}

  async seedMockData() {
    let admin = await this.userRepo.findOne({ where: { email: 'admin@store.com' } }) || await this.userRepo.findOne({ where: { email: 'admin@gmail.com' } });
    if (!admin) {
      admin = await this.userRepo.save(
        this.userRepo.create({
          email: 'admin@store.com',
          password_hash: 'hash',
          full_name: 'Super Admin',
          role: UserRole.SUPER_ADMIN,
        }),
      );
    }

    let staff1 = await this.userRepo.findOne({ where: { email: 'staff1@ktd.vn' } });
    if (!staff1) {
      staff1 = await this.userRepo.save(
        this.userRepo.create({
          email: 'staff1@ktd.vn',
          password_hash: 'hash',
          full_name: 'Nguyễn Văn Minh (Staff)',
          role: UserRole.STAFF,
        }),
      );
    }

    let staff2 = await this.userRepo.findOne({ where: { email: 'manager@ktd.vn' } });
    if (!staff2) {
      staff2 = await this.userRepo.save(
        this.userRepo.create({
          email: 'manager@ktd.vn',
          password_hash: 'hash',
          full_name: 'Trần Thị Thu (Manager)',
          role: UserRole.MANAGER,
        }),
      );
    }

    // Tạo 5 user cho mỗi role
    const mockUsers = [];
    const roles = [UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.STAFF, UserRole.CUSTOMER];
    let userIdx = 1;

    for (const r of roles) {
      for (let i = 1; i <= 5; i++) {
        const email = `${r.toLowerCase()}${i}@ktd.vn`;
        let user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
          user = await this.userRepo.save(
            this.userRepo.create({
              email,
              password_hash: 'hash',
              full_name: `${r} ${i}`,
              role: r,
            }),
          );
        }
        if (r === UserRole.CUSTOMER) {
          mockUsers.push(user); // Chỉ lấy customer để gán cho đơn hàng
        }
        userIdx++;
      }
    }

    const mockProducts = [
      { name: 'Áo Sơ Mi Oxford Slimfit', price: 350000, sku: 'ASM01' },
      { name: 'Áo Polo Pique Cotton', price: 290000, sku: 'POLO01' },
      { name: 'Quần Tây Trousers Premium', price: 450000, sku: 'QT01' },
      { name: 'Áo Khoác Blazer Casual', price: 790000, sku: 'BLZ01' },
      { name: 'Quần Jeans Regular Fit', price: 520000, sku: 'QJ01' },
    ];

    const variants = await this.variantRepo.find({ take: 5, relations: ['size', 'color'] });
    let fallbackVariantId: string | undefined = undefined;
    if (variants.length > 0) {
      fallbackVariantId = variants[0].id;
    }

    const now = new Date();
    // Tạo 100 đơn hàng
    for (let i = 0; i < 100; i++) {
      // Đơn hàng rải rác trong 30 ngày qua
      const dayAgo = Math.floor(Math.random() * 30);
      const randomTimeOffset = Math.random() * 24 * 60 * 60 * 1000;
      const orderDate = new Date(now.getTime() - dayAgo * 24 * 60 * 60 * 1000 - randomTimeOffset);

      const prod = mockProducts[i % mockProducts.length];
      const qty = (i % 3) + 1;
      const subtotal = prod.price * qty;
      const shipping = 30000;
      const total = subtotal + shipping;

      const customer = mockUsers.length > 0 ? mockUsers[i % mockUsers.length] : (admin || staff1);

      // Đơn cũ (> 3 ngày) hầu hết đã giao, đơn mới (<= 3 ngày) đang xử lý/chờ
      const isDelivered = dayAgo > 3;
      const status = isDelivered 
        ? OrderStatus.DELIVERED 
        : (dayAgo > 1 ? OrderStatus.PROCESSING : OrderStatus.PENDING);

      const newOrder = this.orderRepo.create({
        user_id: customer.id,
        status,
        subtotal,
        shipping_fee: shipping,
        discount_amount: 0,
        total,
        shipping_snapshot: {
          receiver_name: customer.full_name,
          phone: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
          address_line: '123 Nguyễn Trãi, Quận 1',
          district: 'Quận 1',
          province: 'TP. Hồ Chí Minh',
        },
        created_at: orderDate,
        delivered_at: isDelivered ? orderDate : undefined,
      });

      const savedOrder = await this.orderRepo.save(newOrder);
      
      const vId = (variants.length > 0 && variants[i % variants.length]) ? variants[i % variants.length].id : fallbackVariantId;
      const vSize = (variants.length > 0 && variants[i % variants.length]?.size) ? variants[i % variants.length].size.name : 'M';
      const vColor = (variants.length > 0 && variants[i % variants.length]?.color) ? variants[i % variants.length].color.name : 'Đen';

      const item = this.orderItemRepo.create({
        order_id: savedOrder.id,
        variant_id: vId,
        product_name: prod.name,
        sku: prod.sku,
        price: prod.price,
        quantity: qty,
        size_name: vSize,
        color_name: vColor,
      });
      await this.orderItemRepo.save(item);

      if (isDelivered || status === OrderStatus.PROCESSING) {
        const payment = this.paymentRepo.create({
          order_id: savedOrder.id,
          method: PaymentMethod.COD,
          status: isDelivered ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          confirmed_by: i % 2 === 0 ? staff1.id : staff2.id,
          paid_at: isDelivered ? orderDate : undefined,
        });
        await this.paymentRepo.save(payment);
      }

      // Seed Return Requests for delivered orders
      if (isDelivered && i % 5 === 0) {
        const returnReasons = [
          'Sản phẩm bị mặc không vừa size (cần đổi sang L)',
          'Áo bị trầy chỉ nhẹ ở phần cổ áo khi bóc hộp',
          'Sản phẩm giao nhầm màu sắc so với đơn hàng đã đặt',
          'Khách đổi ý muốn trả hàng để nhận lại tiền',
          'Chất liệu vải không giống như hình chụp mô tả',
        ];
        const returnStatuses = [
          ReturnStatus.REQUESTED,
          ReturnStatus.APPROVED,
          ReturnStatus.RECEIVED,
          ReturnStatus.REFUNDED,
          ReturnStatus.REJECTED,
        ];

        const reqStatus = returnStatuses[Math.floor(i / 5) % returnStatuses.length];
        const reason = returnReasons[i % returnReasons.length];

        const returnReq = this.returnRepo.create({
          order_id: savedOrder.id,
          user_id: customer.id,
          reason,
          status: reqStatus,
          approved_by: [ReturnStatus.APPROVED, ReturnStatus.RECEIVED, ReturnStatus.REFUNDED].includes(reqStatus) ? staff1.id : undefined,
          refund_amount: reqStatus === ReturnStatus.REFUNDED ? savedOrder.total : undefined,
          rejection_reason: reqStatus === ReturnStatus.REJECTED ? 'Đã quá thời hạn 7 ngày quy định đổi trả sản phẩm' : undefined,
          created_at: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000),
        });

        await this.returnRepo.save(returnReq);
      }
    }

    return { message: 'Khởi tạo dữ liệu ảo CRM thành công (100 đơn hàng, 15 yêu cầu đổi trả & 5 users)', seeded: true };
  }

  async seedSingleOrder() {
    const variants = await this.variantRepo.find({ take: 5, relations: ['size', 'color'] });
    const fallbackVariantId = variants.length > 0 ? variants[0].id : undefined;

    const customers = await this.userRepo.find({ where: { role: UserRole.CUSTOMER } });
    const customer = customers[0] || (await this.userRepo.find())[0];

    const prod = { name: 'Áo Suit Blazer Nam Lịch Lãm', price: 550000, sku: 'BLZ-SINGLE' };
    const qty = 1;
    const subtotal = prod.price * qty;
    const shipping = 30000;
    const total = subtotal + shipping;

    const newOrder = this.orderRepo.create({
      user_id: customer ? customer.id : undefined,
      status: OrderStatus.PENDING,
      subtotal,
      shipping_fee: shipping,
      discount_amount: 0,
      total,
      shipping_snapshot: {
        receiver_name: customer ? customer.full_name : 'Khách Hàng Mẫu',
        phone: '0931143830',
        address_line: '123 Đường Lê Lợi, Quận 1',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
      },
      created_at: new Date(),
    });

    const savedOrder = await this.orderRepo.save(newOrder);

    const item = this.orderItemRepo.create({
      order_id: savedOrder.id,
      variant_id: fallbackVariantId,
      product_name: prod.name,
      sku: prod.sku,
      price: prod.price,
      quantity: qty,
      size_name: variants[0]?.size?.name || 'L',
      color_name: variants[0]?.color?.name || 'Đen',
    });
    await this.orderItemRepo.save(item);

    const payment = this.paymentRepo.create({
      order_id: savedOrder.id,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    return { message: 'Tạo 1 đơn hàng mẫu thành công!', order_id: savedOrder.id };
  }

  async getOverview() {
    const overviewRaw = await this.orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalCompletedOrders')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const pendingOrdersCount = await this.orderRepo.count({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.CONFIRMED },
        { status: OrderStatus.PROCESSING },
        { status: OrderStatus.SHIPPING },
      ],
    });

    const lowStockCount = await this.variantRepo.count({
      where: { is_active: true, stock_quantity: LessThanOrEqual(5) },
    });

    return {
      totalRevenue: Number(overviewRaw?.totalRevenue || 0),
      totalCompletedOrders: Number(overviewRaw?.totalCompletedOrders || 0),
      pendingOrdersCount,
      lowStockCount,
    };
  }

  async getRevenueReport(query: ReportQueryDto) {
    const { startDate, endDate, period = ReportPeriod.DAY } = query;

    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .select(['order.created_at', 'order.total'])
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate: end });
    }

    const orders = await queryBuilder.getRawMany();

    const groupedData = new Map<string, { period: string; revenue: number; orderCount: number }>();

    for (const order of orders) {
      const dateVal = order.order_created_at || order.created_at;
      if (!dateVal) continue;
      const date = new Date(dateVal);
      let periodKey = '';

      if (period === ReportPeriod.YEAR) {
        periodKey = `${date.getFullYear()}`;
      } else if (period === ReportPeriod.QUARTER) {
        const quarterNum = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarterNum}`;
      } else if (period === ReportPeriod.MONTH) {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === ReportPeriod.WEEK) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        periodKey = date.toISOString().split('T')[0];
      }

      const existing = groupedData.get(periodKey) || { period: periodKey, revenue: 0, orderCount: 0 };
      existing.revenue += Number(order.order_total || order.total || 0);
      existing.orderCount += 1;
      groupedData.set(periodKey, existing);
    }

    return Array.from(groupedData.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getTopProducts(limit: number = 10) {
    const rawResults = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('COALESCE(item.product_name, item.sku)', 'productName')
      .addSelect('SUM(item.quantity)::int', 'totalQuantity')
      .addSelect('SUM(item.price * item.quantity)::numeric', 'totalRevenue')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('COALESCE(item.product_name, item.sku)')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(limit)
      .getRawMany();

    return rawResults.map((r) => ({
      productName: r.productName,
      totalQuantity: Number(r.totalQuantity || 0),
      totalRevenue: Number(r.totalRevenue || 0),
    }));
  }

  async getLowStockVariants(threshold: number = 5) {
    const variants = await this.variantRepo.find({
      where: {
        is_active: true,
        stock_quantity: LessThanOrEqual(threshold),
      },
      relations: ['product', 'size', 'color'],
      order: { stock_quantity: 'ASC' },
    });

    return variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      productName: v.product?.name || 'N/A',
      sizeName: v.size?.name || 'N/A',
      colorName: v.color?.name || 'N/A',
      stockQuantity: v.stock_quantity,
      price: v.price_override || v.product?.base_price || 0,
    }));
  }

  async getStaffPerformance() {
    const rawResults = await this.paymentRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.confirmed_user', 'user')
      .innerJoin('payment.order', 'order')
      .select('user.id', 'staffId')
      .addSelect('COALESCE(user.full_name, user.email)', 'staffName')
      .addSelect('user.email', 'staffEmail')
      .addSelect('COUNT(payment.id)::int', 'confirmedOrdersCount')
      .addSelect('SUM(order.total)::numeric', 'totalAmount')
      .where('payment.confirmed_by IS NOT NULL')
      .groupBy('user.id')
      .addGroupBy('user.full_name')
      .addGroupBy('user.email')
      .orderBy('"confirmedOrdersCount"', 'DESC')
      .getRawMany();

    return rawResults.map((r) => ({
      staffId: r.staffId,
      staffName: r.staffName,
      staffEmail: r.staffEmail,
      confirmedOrdersCount: Number(r.confirmedOrdersCount || 0),
      totalAmount: Number(r.totalAmount || 0),
    }));
  }
}
