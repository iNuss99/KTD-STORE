import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Discount } from './entities/discount.entity';
import { DiscountScope } from './entities/discount-scope.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { DiscountType } from '../../common/enums/discount.enum';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Cart } from '../cart/entities/cart.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export interface DiscountValidationResult {
  discount: Discount;
  discount_amount: number;
  applicable_subtotal: number;
}

@Injectable()
export class DiscountsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Discount)
    private discountRepo: Repository<Discount>,
    @InjectRepository(DiscountScope)
    private discountScopeRepo: Repository<DiscountScope>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    private auditLogsService: AuditLogsService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultDiscounts();
  }

  async seedDefaultDiscounts() {
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
      const existing = await this.discountRepo.findOne({ where: { code: item.code } });
      if (!existing) {
        await this.discountRepo.save(this.discountRepo.create(item));
      }
    }
  }

  async findActivePublic() {
    const now = new Date();
    const discounts = await this.discountRepo.find({
      where: { is_active: true },
      order: { value: 'DESC' },
    });
    return discounts
      .filter(
        (d) =>
          now >= new Date(d.valid_from) &&
          now <= new Date(d.valid_to) &&
          (d.max_uses == null || d.used_count < d.max_uses),
      )
      .map((d) => ({
        code: d.code,
        label:
          d.discount_type === DiscountType.PERCENTAGE
            ? `Giảm ${Number(d.value)}%`
            : `Giảm ${Number(d.value) >= 1000 ? `${Math.round(Number(d.value) / 1000)}K` : `${d.value}đ`}`,
        discount_type: d.discount_type,
        value: Number(d.value),
        min_order_amount: Number(d.min_order_amount || 0),
      }));
  }

  async create(dto: CreateDiscountDto, performedByUserId?: string): Promise<Discount> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.discountRepo.findOne({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Mã giảm giá "${code}" đã tồn tại trên hệ thống`);
    }

    const discount = this.discountRepo.create({
      code,
      discount_type: dto.discount_type,
      value: dto.value,
      max_uses: dto.max_uses ?? 100,
      valid_from: new Date(dto.valid_from),
      valid_to: new Date(dto.valid_to),
      min_order_amount: dto.min_order_amount ?? 0,
      is_active: dto.is_active ?? true,
    });

    if (dto.scopes && dto.scopes.length > 0) {
      discount.scopes = dto.scopes.map((s) =>
        this.discountScopeRepo.create({
          category_id: s.category_id,
          brand_id: s.brand_id,
        }),
      );
    }

    const saved = await this.discountRepo.save(discount);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'CREATE_DISCOUNT',
        'Discount',
        saved.id,
        { code: saved.code, value: saved.value, discount_type: saved.discount_type },
      );
    }

    return saved;
  }

  async findAll(): Promise<Discount[]> {
    return this.discountRepo.find({
      relations: ['scopes', 'scopes.category', 'scopes.brand'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepo.findOne({
      where: { id },
      relations: ['scopes', 'scopes.category', 'scopes.brand'],
    });

    if (!discount) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto, performedByUserId?: string): Promise<Discount> {
    const discount = await this.findOne(id);

    if (dto.code && dto.code.trim().toUpperCase() !== discount.code) {
      const newCode = dto.code.trim().toUpperCase();
      const existing = await this.discountRepo.findOne({ where: { code: newCode } });
      if (existing) {
        throw new BadRequestException(`Mã giảm giá "${newCode}" đã tồn tại`);
      }
      discount.code = newCode;
    }

    if (dto.discount_type) discount.discount_type = dto.discount_type;
    if (dto.value !== undefined) discount.value = dto.value;
    if (dto.max_uses !== undefined) discount.max_uses = dto.max_uses;
    if (dto.valid_from) discount.valid_from = new Date(dto.valid_from);
    if (dto.valid_to) discount.valid_to = new Date(dto.valid_to);
    if (dto.min_order_amount !== undefined) discount.min_order_amount = dto.min_order_amount;
    if (dto.is_active !== undefined) discount.is_active = dto.is_active;

    if (dto.scopes !== undefined) {
      // Re-create scopes
      await this.discountScopeRepo.delete({ discount_id: id });
      discount.scopes = dto.scopes.map((s) =>
        this.discountScopeRepo.create({
          discount_id: id,
          category_id: s.category_id,
          brand_id: s.brand_id,
        }),
      );
    }

    const saved = await this.discountRepo.save(discount);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'UPDATE_DISCOUNT',
        'Discount',
        saved.id,
        dto,
      );
    }

    return saved;
  }

  async remove(id: string, performedByUserId?: string): Promise<{ message: string }> {
    const discount = await this.findOne(id);
    await this.discountRepo.remove(discount);

    if (performedByUserId) {
      await this.auditLogsService.log(
        performedByUserId,
        'DELETE_DISCOUNT',
        'Discount',
        id,
        { code: discount.code },
      );
    }

    return { message: 'Đã xóa mã giảm giá thành công' };
  }

  async validateAndCalculate(
    codeStr: string,
    userId: string,
    dtoItems?: { variant_id: string; quantity: number }[],
    entityManager?: EntityManager,
  ): Promise<DiscountValidationResult> {
    const code = codeStr.trim().toUpperCase();
    const manager = entityManager || this.discountRepo.manager;

    const discount = await manager.findOne(Discount, {
      where: { code },
      relations: ['scopes'],
    });

    if (!discount || !discount.is_active) {
      throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (now < new Date(discount.valid_from)) {
      throw new BadRequestException('Mã giảm giá chưa đến thời hạn sử dụng');
    }

    if (now > new Date(discount.valid_to)) {
      throw new BadRequestException('Mã giảm giá đã hết hạn sử dụng');
    }

    if (discount.used_count >= discount.max_uses) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    // Resolve items
    let rawItems: { variant_id: string; quantity: number }[] = [];

    if (dtoItems && dtoItems.length > 0) {
      rawItems = dtoItems;
    } else {
      if (!userId) {
        throw new BadRequestException('Vui lòng đăng nhập hoặc cung cấp danh sách sản phẩm để áp dụng mã');
      }
      const cart = await manager.findOne(Cart, {
        where: { user_id: userId },
        relations: ['items'],
      });
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống, không thể áp dụng mã giảm giá');
      }
      rawItems = cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }));
    }

    let totalSubtotal = 0;
    let applicableSubtotal = 0;

    const scopes = discount.scopes || [];

    for (const itemDto of rawItems) {
      const variant = await manager.findOne(ProductVariant, {
        where: { id: itemDto.variant_id },
        relations: ['product'],
      });

      if (!variant || !variant.is_active || !variant.product || !variant.product.is_active) {
        continue;
      }

      const effectivePrice =
        variant.price_override != null
          ? Number(variant.price_override)
          : Number(variant.product.base_price);

      const itemSubtotal = effectivePrice * itemDto.quantity;
      totalSubtotal += itemSubtotal;

      // Check scope eligibility
      if (scopes.length === 0) {
        // System-wide discount
        applicableSubtotal += itemSubtotal;
      } else {
        const matchesScope = scopes.some((scope) => {
          if (scope.category_id && variant.product.category_id === scope.category_id) return true;
          if (scope.brand_id && variant.product.brand_id === scope.brand_id) return true;
          return false;
        });

        if (matchesScope) {
          applicableSubtotal += itemSubtotal;
        }
      }
    }

    if (totalSubtotal < Number(discount.min_order_amount)) {
      const minAmountFormatted = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(discount.min_order_amount);
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu (${minAmountFormatted}) để áp dụng mã này`,
      );
    }

    if (applicableSubtotal === 0) {
      throw new BadRequestException('Không có sản phẩm nào trong giỏ hàng thuộc phạm vi áp dụng mã');
    }

    let discountAmount = 0;

    if (discount.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = Math.round((applicableSubtotal * Number(discount.value)) / 100);
    } else if (discount.discount_type === DiscountType.FIXED_AMOUNT) {
      discountAmount = Number(discount.value);
    }

    // Cap discount amount at applicable subtotal
    discountAmount = Math.min(discountAmount, applicableSubtotal);

    return {
      discount,
      discount_amount: discountAmount,
      applicable_subtotal: applicableSubtotal,
    };
  }
}
