import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNumber, Min } from 'class-validator';
import { Settlement } from './settlement.entity';
import { Equipment } from './equipment.entity';
import { DamageType } from './inspection-item.entity';

@Entity('settlement_items')
export class SettlementItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  settlementId: string;

  @ManyToOne(() => Settlement, (s) => s.items)
  @JoinColumn({ name: 'settlementId' })
  settlement: Settlement;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  rentalDays: number;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  rentalFee: number;

  @Column({ type: 'simple-enum', enum: DamageType, nullable: true })
  deductionType: DamageType;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  deductionAmount: number;

  @Column({ nullable: true })
  inspectionItemId: string;

  @Column({ nullable: true })
  responsibility: string;

  @Column({ nullable: true })
  photoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
