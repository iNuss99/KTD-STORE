import AppDataSource from '../typeorm.config';
import { Order } from '../modules/orders/entities/order.entity';
import { Like } from 'typeorm';

async function run() {
  console.log('🚀 Đang kết nối cơ sở dữ liệu...');
  const dataSource = await AppDataSource.initialize();
  console.log('✅ Đã kết nối cơ sở dữ liệu thành công!');

  const orderRepo = dataSource.getRepository(Order);

  // Tìm tất cả đơn hàng có tag [MOCK_ORDER]
  const mockOrders = await orderRepo.find({
    where: {
      note: Like('%[MOCK_ORDER]%'),
    },
    select: ['id'],
  });

  if (mockOrders.length === 0) {
    console.log('ℹ️ Không tìm thấy đơn hàng ảo nào có tag [MOCK_ORDER] trong hệ thống.');
    await dataSource.destroy();
    return;
  }

  console.log(`⚠️ Tìm thấy ${mockOrders.length} đơn hàng ảo [MOCK_ORDER]. Đang tiến hành xóa...`);
  
  const orderIds = mockOrders.map((o) => o.id);
  // Xóa theo batch hoặc remove
  await orderRepo.delete(orderIds);

  console.log(`✅ Đã dọn dẹp thành công ${mockOrders.length} đơn hàng ảo cùng toàn bộ order_items và payments liên quan.`);
  await dataSource.destroy();
}

run().catch(async (err) => {
  console.error('❌ Lỗi khi dọn dẹp đơn hàng ảo:', err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
