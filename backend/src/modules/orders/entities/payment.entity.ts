import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/order.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  confirmed_by: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'confirmed_by' })
  confirmed_user: User;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  refund_amount: number;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
