import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDateString, IsEnum, IsArray } from 'class-validator';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum AddShowRequestStatus {
  PENDING = 'pending',
  CHECKING = 'checking',
  APPROVED = 'approved',
  PARTIAL_APPROVED = 'partial_approved',
  REJECTED = 'rejected',
  CONFIRMED = 'confirmed',
}

export enum CheckItemStatus {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning',
  PENDING = 'pending',
}

export interface CheckResult {
  equipmentOccupancy: CheckItemStatus;
  venueWindow: CheckItemStatus;
  technicianAvailability: CheckItemStatus;
  depositSupplement: CheckItemStatus;
  details?: {
    equipmentConflicts?: { equipmentId: string; equipmentName: string; conflictProject: string; conflictDates: string[] }[];
    venueConflicts?: { date: string; reason: string }[];
    unavailableTechnicians?: { technicianId: string; name: string; reason: string }[];
    requiredDeposit?: number;
    currentDeposit?: number;
    additionalDeposit?: number;
  };
}

export interface TimeAdjustment {
  rehearsalPeriod: { start: string; end: string };
  outboundDate: string;
  setupDate: string;
  returnDate: string;
}

export interface AlternativeEquipment {
  originalEquipmentId: string;
  originalEquipmentName: string;
  alternativeEquipmentId: string;
  alternativeEquipmentName: string;
  quantity: number;
  priceDifference: number;
}

@Entity('add_show_requests')
export class AddShowRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  requestedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @Column({ type: 'simple-json' })
  @IsArray()
  additionalPerformanceDates: string[];

  @Column({ type: 'simple-json', nullable: true })
  requestedEquipment: { equipmentId: string; quantity: number }[];

  @Column({ type: 'simple-enum', enum: AddShowRequestStatus, default: AddShowRequestStatus.PENDING })
  status: AddShowRequestStatus;

  @Column({ type: 'simple-json', nullable: true })
  checkResult: CheckResult;

  @Column({ type: 'simple-json', nullable: true })
  timeAdjustment: TimeAdjustment;

  @Column({ type: 'simple-json', nullable: true })
  approvedEquipment: { equipmentId: string; quantity: number }[];

  @Column({ type: 'simple-json', nullable: true })
  alternativeEquipments: AlternativeEquipment[];

  @Column({ type: 'simple-json', nullable: true })
  supplierStockList: { equipmentId: string; equipmentName: string; quantity: number; supplierId: string }[];

  @Column({ type: 'boolean', default: false })
  alternativeConfirmed: boolean;

  @Column({ type: 'real', default: 0 })
  additionalDeposit: number;

  @Column({ type: 'real', default: 0 })
  additionalRentalFee: number;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
