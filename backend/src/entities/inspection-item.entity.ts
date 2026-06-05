import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { Inspection } from './inspection.entity';
import { Equipment } from './equipment.entity';

export enum DamageType {
  NORMAL_WEAR = 'normal_wear',
  MISSING = 'missing',
  OVERDUE = 'overdue',
  ONSITE_DAMAGE = 'onsite_damage',
  SUPPLIER_SHORTAGE = 'supplier_shortage',
}

@Entity('inspection_items')
export class InspectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inspectionId: string;

  @ManyToOne(() => Inspection, (i) => i.items)
  @JoinColumn({ name: 'inspectionId' })
  inspection: Inspection;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ type: 'simple-enum', enum: DamageType, nullable: true })
  damageType: DamageType;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  photoUrls: string[];

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  deductionAmount: number;

  @Column({ nullable: true })
  responsibility: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
