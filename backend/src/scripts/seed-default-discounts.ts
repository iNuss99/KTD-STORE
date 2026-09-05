import AppDataSource from '../typeorm.config';
import { Discount } from '../modules/discounts/entities/discount.entity';
import { DiscountType } from '../common/enums/discount.enum';

async function seed() {
  console.log('🚀 Kết nối CSDL để kiểm tra & seed mã giảm giá...');
  const dataSource = await AppDataSource.initialize();
  const repo = dataSource.getRepository(Discount);

  const defaultDiscounts = [
    {
      code: 'GIAM20K',
      discount_type: DiscountType.FIXED_AMOUNT,
      value: 20000,
      max_uses: 10000,
      used_count: 0,
      valid_from: new Date('2025-01-01'),
      valid_to: new Date('2030-01-01'),
      min_order_amount: 0,
      is_active: true,
    },
    {
      code: 'GIAM10',
      discount_type: DiscountType.PERCENTAGE,
      value: 10,
      max_uses: 10000,
      used_count: 0,
      valid_from: new Date('2025-01-01'),
      valid_to: new Date('2030-01-01'),
      min_order_amount: 0,
      is_active: true,
    },
    {
      code: 'GIAM12',
      discount_type: DiscountType.PERCENTAGE,
      value: 12,
      max_uses: 10000,
      used_count: 0,
      valid_from: new Date('2025-01-01'),
      valid_to: new Date('2030-01-01'),
      min_order_amount: 0,
      is_active: true,
    },
  ];

  for (const item of defaultDiscounts) {
    const existing = await repo.findOne({ where: { code: item.code } });
    if (!existing) {
      await repo.save(repo.create(item));
      console.log(`✅ Đã tạo mã giảm giá: ${item.code}`);
    } else {
      console.log(`ℹ️ Mã giảm giá ${item.code} đã tồn tại.`);
    }
  }

  const all = await repo.find();
  console.log('📋 Danh sách mã giảm giá hiện có trong CSDL:');
  console.table(
    all.map((d) => ({
      code: d.code,
      type: d.discount_type,
      value: d.value,
      min_order: d.min_order_amount,
      is_active: d.is_active,
    })),
  );

  await dataSource.destroy();
}

seed().catch(async (err) => {
  console.error('❌ Lỗi khi seed mã giảm giá:', err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
