import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../../../common/enums/role.enum';
import { WishlistItem } from '../../wishlists/entities/wishlist-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  is_locked: boolean;

  @Column({ nullable: true })
  refresh_token_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.user)
  wishlist_items: WishlistItem[];
}
