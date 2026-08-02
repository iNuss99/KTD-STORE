import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. Đen, Trắng, Red, Blue

  @Column({ unique: true })
  code: string; // e.g. BLK, WHT, RED, BLU

  @Column({ nullable: true })
  hex_code: string; // e.g. #000000
}
