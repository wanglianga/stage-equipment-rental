import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule, ScheduleStatus } from '../entities';
import { EquipmentService } from '../equipment/equipment.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private repo: Repository<Schedule>,
    private equipmentService: EquipmentService,
  ) {}

  async create(data: Partial<Schedule>) {
    const schedule = this.repo.create(data);
    return this.repo.save(schedule);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByProject(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { startDate: 'ASC' } });
  }

  async findByEquipment(equipmentId: string) {
    return this.repo.find({ where: { equipmentId }, order: { startDate: 'ASC' } });
  }

  async lock(id: string) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) return null;
    if (schedule.status !== ScheduleStatus.REQUESTED) return null;
    schedule.status = ScheduleStatus.LOCKED;
    await this.equipmentService.updateAvailability(schedule.equipmentId, -schedule.quantity);
    return this.repo.save(schedule);
  }

  async markOutbound(id: string) {
    return this.updateStatus(id, ScheduleStatus.OUTBOUND);
  }

  async markSetup(id: string) {
    return this.updateStatus(id, ScheduleStatus.SETUP);
  }

  async markReturned(id: string) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) return null;
    schedule.status = ScheduleStatus.RETURNED;
    await this.equipmentService.updateAvailability(schedule.equipmentId, schedule.quantity);
    return this.repo.save(schedule);
  }

  async cancel(id: string) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) return null;
    if (schedule.status === ScheduleStatus.LOCKED) {
      await this.equipmentService.updateAvailability(schedule.equipmentId, schedule.quantity);
    }
    schedule.status = ScheduleStatus.CANCELLED;
    return this.repo.save(schedule);
  }

  private async updateStatus(id: string, status: ScheduleStatus) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }
}
