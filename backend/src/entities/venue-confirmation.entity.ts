import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('venue_confirmations')
export class VenueConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (p) => p.venueConfirmations)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  technicianId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'technicianId' })
  technician: User;

  @Column({ type: 'simple-json', nullable: true })
  setupWindow: { start: string; end: string };

  @Column({ type: 'simple-json', nullable: true })
  powerConditions: { totalKW: number; phases: number; outlets: string };

  @Column({ type: 'simple-json', nullable: true })
  riggingPoints: { count: number; maxLoad: number; type: string };

  @Column({ type: 'simple-json', nullable: true })
  restrictions: Record<string, any>;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
