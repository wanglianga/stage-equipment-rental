import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDateString, IsEnum } from 'class-validator';
import { Project } from './project.entity';
import { Equipment } from './equipment.entity';
import { Inspection } from './inspection.entity';

export enum ScheduleStatus {
  REQUESTED = 'requested',
  LOCKED = 'locked',
  OUTBOUND = 'outbound',
  SETUP = 'setup',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (p) => p.schedules)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column()
  quantity: number;

  @Column({ type: 'date' })
  @IsDateString()
  startDate: string;

  @Column({ type: 'date' })
  @IsDateString()
  endDate: string;

  @Column({ type: 'simple-enum', enum: ScheduleStatus, default: ScheduleStatus.REQUESTED })
  status: ScheduleStatus;

  @OneToMany(() => Inspection, (i) => i.schedule)
  inspections: Inspection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
