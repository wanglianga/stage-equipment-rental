import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDateString } from 'class-validator';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';
import { VenueConfirmation } from './venue-confirmation.entity';
import { Settlement } from './settlement.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VENUE_CONFIRMED = 'venue_confirmed',
  EQUIPMENT_LOCKED = 'equipment_locked',
  IN_PROGRESS = 'in_progress',
  RETURNED = 'returned',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  brokerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'brokerId' })
  broker: User;

  @Column({ type: 'simple-enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ type: 'simple-json' })
  performanceDates: string[];

  @Column({ type: 'simple-json', nullable: true })
  rehearsalPeriod: { start: string; end: string };

  @Column({ type: 'simple-json', nullable: true })
  stageSpecs: { width: number; depth: number; height: number; type: string };

  @Column({ type: 'simple-json', nullable: true })
  equipmentList: { equipmentId: string; quantity: number }[];

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Schedule, (s) => s.project)
  schedules: Schedule[];

  @OneToMany(() => VenueConfirmation, (v) => v.project)
  venueConfirmations: VenueConfirmation[];

  @OneToMany(() => Settlement, (s) => s.project)
  settlements: Settlement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
