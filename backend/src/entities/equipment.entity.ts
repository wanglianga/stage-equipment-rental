import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { User } from './user.entity';

export enum EquipmentCategory {
  LIGHTING = 'lighting',
  AUDIO = 'audio',
  CONSOLE = 'console',
  CABLE = 'cable',
  STAND = 'stand',
  CASE = 'case',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  supplierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplierId' })
  supplier: User;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ type: 'simple-enum', enum: EquipmentCategory })
  @IsEnum(EquipmentCategory)
  category: EquipmentCategory;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'simple-json', nullable: true })
  specs: Record<string, any>;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  dailyRate: number;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  deposit: number;

  @Column({ default: 1 })
  @IsNumber()
  @Min(0)
  totalQuantity: number;

  @Column({ default: 0 })
  availableQuantity: number;

  @Column({ type: 'simple-json', nullable: true })
  depositTerms: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
