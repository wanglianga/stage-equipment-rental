import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueConfirmation } from '../entities';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(VenueConfirmation)
    private repo: Repository<VenueConfirmation>,
  ) {}

  async create(data: Partial<VenueConfirmation>) {
    const vc = this.repo.create(data);
    return this.repo.save(vc);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByProject(projectId: string) {
    return this.repo.find({ where: { projectId } });
  }

  async confirm(id: string, data: Partial<VenueConfirmation>) {
    await this.repo.update(id, { ...data, confirmed: true });
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<VenueConfirmation>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
