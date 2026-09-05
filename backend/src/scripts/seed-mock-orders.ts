import { DataSource } from 'typeorm';
import AppDataSource from '../typeorm.config';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { Payment } from '../modules/orders/entities/payment.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { User } from '../modules/users/entities/user.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../common/enums/order.enum';
import { UserRole } from '../common/enums/role.enum';

// Danh sách họ, đệm, tên Việt Nam chuẩn
const HO_LIST = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan',
  'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đoàn'
];

const DEM_NAM = ['Văn', 'Quốc', 'Thành', 'Minh', 'Đức', 'Hữu', 'Hoàng', 'Tuấn', 'Hải', 'Gia'];
const TEN_NAM = ['An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hải', 'Hiếu', 'Huy', 'Hùng', 'Khoa', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Thịnh', 'Tuấn', 'Tùng', 'Việt', 'Vinh'];

const DEM_NU = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Phương', 'Bảo', 'Kim', 'Xuân', 'Khánh', 'Ánh'];
const TEN_NU = ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hạnh', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'My', 'Ngân', 'Ngọc', 'Nhi', 'Như', 'Oanh', 'Phương', 'Quỳnh', 'Thảo', 'Thư', 'Trang', 'Tuyết', 'Uyên', 'Yến'];

function getRandomVietnameseName(): string {
  const isFemale = Math.random() < 0.4;
  const ho = HO_LIST[Math.floor(Math.random() * HO_LIST.length)];
  const dem = isFemale
    ? DEM_NU[Math.floor(Math.random() * DEM_NU.length)]
    : DEM_NAM[Math.floor(Math.random() * DEM_NAM.length)];
  const ten = isFemale
    ? TEN_NU[Math.floor(Math.random() * TEN_NU.length)]
    : TEN_NAM[Math.floor(Math.random() * TEN_NAM.length)];
  return `${ho} ${dem} ${ten}`;
}

const VN_PHONE_PREFIXES = ['090', '091', '098', '097', '035', '038', '077', '089', '093', '086', '094', '036', '079', '083'];

function getRandomVietnamesePhone(): string {
  const prefix = VN_PHONE_PREFIXES[Math.floor(Math.random() * VN_PHONE_PREFIXES.length)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${prefix}${suffix}`;
}

interface AddressData {
  address_line: string;
  ward: string;
  district: string;
  province: string;
}

const VN_ADDRESS_LIST: AddressData[] = [
  // TP. Hồ Chí Minh
  { address_line: '124/8 Nguyễn Trãi', ward: 'Phường Phạm Ngũ Lão', district: 'Quận 1', province: 'TP. Hồ Chí Minh' },
  { address_line: '45 Lê Duẩn', ward: 'Phường Bến Nghé', district: 'Quận 1', province: 'TP. Hồ Chí Minh' },
  { address_line: '72 Lê Thánh Tôn', ward: 'Phường Bến Nghé', district: 'Quận 1', province: 'TP. Hồ Chí Minh' },
  { address_line: '215 Điện Biên Phủ', ward: 'Phường 15', district: 'Quận Bình Thạnh', province: 'TP. Hồ Chí Minh' },
  { address_line: '88 Nguyễn Đình Chiểu', ward: 'Phường Đa Kao', district: 'Quận 1', province: 'TP. Hồ Chí Minh' },
  { address_line: '350 Cách Mạng Tháng Tám', ward: 'Phường 10', district: 'Quận 3', province: 'TP. Hồ Chí Minh' },
  { address_line: '15 Cao Thắng', ward: 'Phường 2', district: 'Quận 3', province: 'TP. Hồ Chí Minh' },
  { address_line: '52 Nguyễn Thị Minh Khai', ward: 'Phường Võ Thị Sáu', district: 'Quận 3', province: 'TP. Hồ Chí Minh' },
  { address_line: '102 Ba Tháng Hai', ward: 'Phường 12', district: 'Quận 10', province: 'TP. Hồ Chí Minh' },
  { address_line: '488 Sư Vạn Hạnh', ward: 'Phường 9', district: 'Quận 10', province: 'TP. Hồ Chí Minh' },
  { address_line: '20 Võ Văn Tần', ward: 'Phường Võ Thị Sáu', district: 'Quận 3', province: 'TP. Hồ Chí Minh' },
  { address_line: '68 Hoàng Văn Thụ', ward: 'Phường 9', district: 'Quận Phú Nhuận', province: 'TP. Hồ Chí Minh' },
  { address_line: '12 Quang Trung', ward: 'Phường 10', district: 'Quận Gò Vấp', province: 'TP. Hồ Chí Minh' },
  { address_line: '24 Đường số 7', ward: 'Phường An Phú', district: 'TP. Thủ Đức', province: 'TP. Hồ Chí Minh' },
  { address_line: '105 Thảo Điền', ward: 'Phường Thảo Điền', district: 'TP. Thủ Đức', province: 'TP. Hồ Chí Minh' },
  { address_line: '36 Nguyễn Văn Linh', ward: 'Phường Tân Phong', district: 'Quận 7', province: 'TP. Hồ Chí Minh' },
  { address_line: '185 Cộng Hòa', ward: 'Phường 13', district: 'Quận Tân Bình', province: 'TP. Hồ Chí Minh' },
  { address_line: '92 Trường Chinh', ward: 'Phường 12', district: 'Quận Tân Bình', province: 'TP. Hồ Chí Minh' },
  // Hà Nội
  { address_line: '18 Hàng Gai', ward: 'Phường Hàng Gai', district: 'Quận Hoàn Kiếm', province: 'Hà Nội' },
  { address_line: '54 Tràng Tiền', ward: 'Phường Tràng Tiền', district: 'Quận Hoàn Kiếm', province: 'Hà Nội' },
  { address_line: '120 Bà Triệu', ward: 'Phường Hàng Bài', district: 'Quận Hoàn Kiếm', province: 'Hà Nội' },
  { address_line: '75 Cầu Giấy', ward: 'Phường Dịch Vọng', district: 'Quận Cầu Giấy', province: 'Hà Nội' },
  { address_line: '226 Xuân Thủy', ward: 'Phường Dịch Vọng Hậu', district: 'Quận Cầu Giấy', province: 'Hà Nội' },
  { address_line: '198 Xã Đàn', ward: 'Phường Nam Đồng', district: 'Quận Đống Đa', province: 'Hà Nội' },
  { address_line: '85 Chùa Bộc', ward: 'Phường Quang Trung', district: 'Quận Đống Đa', province: 'Hà Nội' },
  { address_line: '42 Liễu Giai', ward: 'Phường Cống Vị', district: 'Quận Ba Đình', province: 'Hà Nội' },
  { address_line: '91 Nguyễn Chí Thanh', ward: 'Phường Láng Thượng', district: 'Quận Đống Đa', province: 'Hà Nội' },
  { address_line: '16 Đại Cồ Việt', ward: 'Phường Lê Đại Hành', district: 'Quận Hai Bà Trưng', province: 'Hà Nội' },
  { address_line: '102 Hoàng Hoa Thám', ward: 'Phường Thụy Khuê', district: 'Quận Tây Hồ', province: 'Hà Nội' },
  // Đà Nẵng
  { address_line: '48 Bạch Đằng', ward: 'Phường Hải Châu 1', district: 'Quận Hải Châu', province: 'Đà Nẵng' },
  { address_line: '105 Nguyễn Văn Linh', ward: 'Phường Nam Dương', district: 'Quận Hải Châu', province: 'Đà Nẵng' },
  { address_line: '230 Hùng Vương', ward: 'Phường Vĩnh Trung', district: 'Quận Thanh Khê', province: 'Đà Nẵng' },
  { address_line: '15 Võ Nguyên Giáp', ward: 'Phường Phước Mỹ', district: 'Quận Sơn Trà', province: 'Đà Nẵng' },
  { address_line: '76 Lê Duẩn', ward: 'Phường Thạch Thang', district: 'Quận Hải Châu', province: 'Đà Nẵng' },
  // Cần Thơ, Hải Phòng, Bình Dương
  { address_line: '56 Đại lộ Hòa Bình', ward: 'Phường An Cư', district: 'Quận Ninh Kiều', province: 'Cần Thơ' },
  { address_line: '120 đường 30 Tháng 4', ward: 'Phường An Phú', district: 'Quận Ninh Kiều', province: 'Cần Thơ' },
  { address_line: '32 Lạch Tray', ward: 'Phường Lạch Tray', district: 'Quận Ngô Quyền', province: 'Hải Phòng' },
  { address_line: '89 Điện Biên Phủ', ward: 'Phường Minh Khai', district: 'Quận Hồng Bàng', province: 'Hải Phòng' },
  { address_line: '12 Đại lộ Bình Dương', ward: 'Phường Phú Hòa', district: 'TP. Thủ Dầu Một', province: 'Bình Dương' },
  { address_line: '45 ĐT743', ward: 'Phường Dĩ An', district: 'TP. Dĩ An', province: 'Bình Dương' },
  { address_line: '68 Đường 30/4', ward: 'Phường Trung Dũng', district: 'TP. Biên Hòa', province: 'Đồng Nai' },
];

function getRandomAddress(): AddressData {
  return VN_ADDRESS_LIST[Math.floor(Math.random() * VN_ADDRESS_LIST.length)];
}

async function run() {
  console.log('🚀 Đang khởi động kết nối tới cơ sở dữ liệu...');
  const dataSource = await AppDataSource.initialize();
  console.log('✅ Đã kết nối cơ sở dữ liệu thành công!');

  const orderRepo = dataSource.getRepository(Order);
  const orderItemRepo = dataSource.getRepository(OrderItem);
  const paymentRepo = dataSource.getRepository(Payment);
  const userRepo = dataSource.getRepository(User);
  const variantRepo = dataSource.getRepository(ProductVariant);

  // 1. Lấy danh sách khách hàng
  let customers = await userRepo.find({ where: { role: UserRole.CUSTOMER } });
  if (customers.length === 0) {
    customers = await userRepo.find();
  }
  console.log(`📦 Tìm thấy ${customers.length} người dùng/khách hàng khả dụng.`);

  // 2. Lấy nhân viên / admin để confirm thanh toán
  const staffUsers = await userRepo.find({
    where: [{ role: UserRole.SUPER_ADMIN }, { role: UserRole.CEO }, { role: UserRole.MANAGER }, { role: UserRole.STAFF }],
  });
  const defaultStaff = staffUsers.length > 0 ? staffUsers[0] : customers[0];

  // 3. Lấy danh sách ProductVariants thật cùng với Product, Size, Color
  const variants = await variantRepo.find({
    relations: ['product', 'size', 'color'],
    where: { is_active: true },
  });

  if (variants.length === 0) {
    console.error('❌ Không tìm thấy ProductVariant nào trong database! Vui lòng tạo sản phẩm trước.');
    await dataSource.destroy();
    return;
  }
  console.log(`📦 Tìm thấy ${variants.length} biến thể sản phẩm thật sẵn sàng liên kết.`);

  // 4. Tạo danh sách trạng thái cho 100 đơn hàng:
  // 70 DELIVERED, 10 SHIPPING, 8 PROCESSING, 7 PENDING, 5 CANCELLED
  const statusList: OrderStatus[] = [
    ...Array(70).fill(OrderStatus.DELIVERED),
    ...Array(10).fill(OrderStatus.SHIPPING),
    ...Array(8).fill(OrderStatus.PROCESSING),
    ...Array(7).fill(OrderStatus.PENDING),
    ...Array(5).fill(OrderStatus.CANCELLED),
  ];

  // Shuffle status list để phân bố ngẫu nhiên
  for (let i = statusList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusList[i], statusList[j]] = [statusList[j], statusList[i]];
  }

  const paymentMethods = [
    PaymentMethod.COD,
    PaymentMethod.COD,
    PaymentMethod.VNPAY,
    PaymentMethod.MOMO,
    PaymentMethod.BANK_TRANSFER,
  ];

  const now = new Date();
  let totalCreated = 0;
  let totalRevenue = 0;
  const statusCount: Record<string, number> = {};

  console.log('⏳ Bắt đầu tạo 100 đơn hàng ảo chuẩn Việt Nam...');

  for (let i = 0; i < 100; i++) {
    const status = statusList[i];
    statusCount[status] = (statusCount[status] || 0) + 1;

    // Thời gian tạo đơn: rải trong 45 ngày qua
    let dayAgo: number;
    if (status === OrderStatus.DELIVERED) {
      // Đơn đã giao rải từ 3 đến 45 ngày trước
      dayAgo = Math.floor(3 + Math.random() * 42);
    } else if (status === OrderStatus.SHIPPING) {
      dayAgo = Math.floor(1 + Math.random() * 3);
    } else if (status === OrderStatus.PROCESSING) {
      dayAgo = Math.floor(1 + Math.random() * 2);
    } else if (status === OrderStatus.PENDING) {
      dayAgo = Math.floor(1 + Math.random() * 3);
    } else {
      // CANCELLED
      dayAgo = Math.floor(1 + Math.random() * 40);
    }

    // Giờ tạo đơn từ 08:00 đến 22:30
    const hour = Math.floor(8 + Math.random() * 14);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);

    const createdAt = new Date(now.getTime() - dayAgo * 24 * 60 * 60 * 1000);
    createdAt.setHours(hour, minute, second, 0);

    // Ngày giao hàng (nếu DELIVERED): 1 đến 3 ngày sau ngày đặt
    let deliveredAt: Date | undefined = undefined;
    if (status === OrderStatus.DELIVERED) {
      const deliveryDays = Math.floor(1 + Math.random() * 3);
      deliveredAt = new Date(createdAt.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
      if (deliveredAt > now) {
        deliveredAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 giờ trước
      }
    }

    // Chọn khách hàng ngẫu nhiên
    const customer = customers[i % customers.length];
    const receiverName = getRandomVietnameseName();
    const phone = getRandomVietnamesePhone();
    const address = getRandomAddress();

    // Chọn 1 đến 3 sản phẩm ngẫu nhiên cho đơn hàng
    const itemCount = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
    const orderVariants: ProductVariant[] = [];
    for (let k = 0; k < itemCount; k++) {
      const randomVar = variants[Math.floor(Math.random() * variants.length)];
      orderVariants.push(randomVar);
    }

    // Tính tiền
    let subtotal = 0;
    const itemsData = orderVariants.map((v) => {
      const price = Number(v.price_override || v.product.base_price || 250000);
      const quantity = Math.random() < 0.8 ? 1 : 2;
      subtotal += price * quantity;
      return {
        variant: v,
        price,
        quantity,
      };
    });

    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const discountAmount = subtotal >= 1000000 && Math.random() < 0.4 ? 50000 : 0;
    const total = subtotal + shippingFee - discountAmount;

    if (status === OrderStatus.DELIVERED) {
      totalRevenue += total;
    }

    // Tạo đơn hàng
    const order = orderRepo.create({
      user_id: customer.id,
      status,
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total,
      shipping_snapshot: {
        receiver_name: receiverName,
        phone,
        address_line: address.address_line,
        ward: address.ward,
        district: address.district,
        province: address.province,
      },
      note: `[MOCK_ORDER] Đơn hàng mô phỏng #${i + 1} - Khách: ${receiverName}`,
      created_at: createdAt,
      delivered_at: deliveredAt,
    });

    const savedOrder = await orderRepo.save(order);

    // Tạo các OrderItem
    for (const it of itemsData) {
      const v = it.variant;
      const orderItem = orderItemRepo.create({
        order_id: savedOrder.id,
        variant_id: v.id,
        product_name: v.product ? v.product.name : 'Sản phẩm Menwear',
        sku: v.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        size_name: v.size ? v.size.name : 'L',
        color_name: v.color ? v.color.name : 'Đen',
        price: it.price,
        quantity: it.quantity,
      });
      await orderItemRepo.save(orderItem);
    }

    // Tạo bản ghi Payment
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    let payStatus: PaymentStatus = PaymentStatus.PENDING;
    let paidAt: Date | undefined = undefined;

    if (status === OrderStatus.DELIVERED) {
      payStatus = PaymentStatus.COMPLETED;
      paidAt = deliveredAt || createdAt;
    } else if (status === OrderStatus.CANCELLED) {
      payStatus = method === PaymentMethod.COD ? PaymentStatus.FAILED : PaymentStatus.REFUNDED;
    } else if (method !== PaymentMethod.COD) {
      // VNPAY / MOMO / BANK_TRANSFER khi đã confirm/processing thường đã thanh toán
      payStatus = PaymentStatus.COMPLETED;
      paidAt = createdAt;
    }

    const payment = paymentRepo.create({
      order_id: savedOrder.id,
      method,
      status: payStatus,
      confirmed_by: defaultStaff ? defaultStaff.id : undefined,
      paid_at: paidAt,
      created_at: createdAt,
    });
    await paymentRepo.save(payment);

    totalCreated++;
    if (totalCreated % 20 === 0) {
      console.log(`  -> Đã tạo xong ${totalCreated}/100 đơn...`);
    }
  }

  console.log('\n=========================================');
  console.log('🎉 TẠO THÀNH CÔNG 100 ĐƠN HÀNG ẢO VIỆT NAM!');
  console.log('=========================================');
  console.log(`Tổng số đơn tạo: ${totalCreated}`);
  console.log(`Tổng doanh thu đơn thành công (DELIVERED): ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}`);
  console.log('Phân bổ trạng thái:');
  Object.entries(statusCount).forEach(([st, cnt]) => {
    console.log(`  - ${st}: ${cnt} đơn`);
  });
  console.log('Gắn tag an toàn: [MOCK_ORDER] (Dễ dàng dọn dẹp khi cần)');
  console.log('=========================================\n');

  await dataSource.destroy();
}

run().catch(async (err) => {
  console.error('❌ Lỗi khi chạy seed:', err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
