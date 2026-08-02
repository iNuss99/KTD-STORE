import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Discount } from './discount.entity';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('discount_scopes')
export class DiscountScope {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  discount_id: string;

  @ManyToOne(() => Discount, (discount) => discount.scopes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @Column({ nullable: true })
  category_id: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  brand_id: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;
}
