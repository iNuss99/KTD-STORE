import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { DiscountType } from '../../../common/enums/discount.enum';
import { DiscountScope } from './discount-scope.entity';

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  discount_type: DiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ default: 100 })
  max_uses: number;

  @Column({ default: 0 })
  used_count: number;

  @Column({ type: 'timestamp' })
  valid_from: Date;

  @Column({ type: 'timestamp' })
  valid_to: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  min_order_amount: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => DiscountScope, (scope) => scope.discount, { cascade: true })
  scopes: DiscountScope[];
}
