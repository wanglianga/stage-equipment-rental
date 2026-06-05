import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNumber, Min } from 'class-validator';
import { Project } from './project.entity';
import { SettlementItem } from './settlement-item.entity';

export enum SettlementStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (p) => p.settlements)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  totalRentalFee: number;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  totalDeposit: number;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  totalDeduction: number;

  @Column({ type: 'real', default: 0 })
  @IsNumber()
  @Min(0)
  finalAmount: number;

  @Column({ type: 'simple-enum', enum: SettlementStatus, default: SettlementStatus.PENDING })
  status: SettlementStatus;

  @OneToMany(() => SettlementItem, (i) => i.settlement)
  items: SettlementItem[];

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
