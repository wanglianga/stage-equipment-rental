import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';
import { InspectionItem } from './inspection-item.entity';

export enum InspectionType {
  OUTBOUND = 'outbound',
  RETURN = 'return',
}

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scheduleId: string;

  @ManyToOne(() => Schedule, (s) => s.inspections)
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @Column({ type: 'simple-enum', enum: InspectionType })
  @IsEnum(InspectionType)
  type: InspectionType;

  @Column()
  inspectorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspectorId' })
  inspector: User;

  @Column({ type: 'date' })
  inspectionDate: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => InspectionItem, (i) => i.inspection)
  items: InspectionItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
