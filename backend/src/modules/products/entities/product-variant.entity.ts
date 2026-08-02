import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, VersionColumn } from 'typeorm';
import { Product } from './product.entity';
import { Size } from './size.entity';
import { Color } from './color.entity';

@Entity('product_variants')
@Unique(['product_id', 'size_id', 'color_id'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  size_id: string;

  @ManyToOne(() => Size)
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @Column()
  color_id: string;

  @ManyToOne(() => Color)
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price_override: number;

  @Column({ default: 0 })
  stock_quantity: number;

  @VersionColumn({ default: 1 })
  version: number;

  @Column({ default: true })
  is_active: boolean;
}
