import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sizes')
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. S, M, L, XL, XXL

  @Column({ unique: true })
  code: string; // e.g. S, M, L, XL, XXL
}
