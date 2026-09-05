import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Color } from './color.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', nullable: true })
  color_id: string | null;

  @ManyToOne(() => Color, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: Color | null;

  @Column()
  url: string;

  @Column({ nullable: true })
  alt_text: string;

  @Column({ default: 0 })
  sort_order: number;
}
