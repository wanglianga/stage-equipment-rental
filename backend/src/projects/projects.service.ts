import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../entities';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private repo: Repository<Project>,
  ) {}

  async create(data: Partial<Project>) {
    const project = this.repo.create(data);
    return this.repo.save(project);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByBroker(brokerId: string) {
    return this.repo.find({ where: { brokerId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: ProjectStatus) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Project>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
