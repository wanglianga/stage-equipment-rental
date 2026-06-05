import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection, InspectionItem, InspectionType, DamageType } from '../entities';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepo: Repository<Inspection>,
    @InjectRepository(InspectionItem)
    private itemRepo: Repository<InspectionItem>,
  ) {}

  async create(data: Partial<Inspection> & { items?: Partial<InspectionItem>[] }) {
    const { items, ...inspectionData } = data;
    const inspection = this.inspectionRepo.create(inspectionData);
    const saved = await this.inspectionRepo.save(inspection);
    if (items && items.length > 0) {
      const savedItems = items.map((item) => this.itemRepo.create({ ...item, inspectionId: saved.id }));
      saved.items = await this.itemRepo.save(savedItems);
    }
    return saved;
  }

  async findAll() {
    return this.inspectionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const inspection = await this.inspectionRepo.findOne({ where: { id } });
    if (inspection) {
      inspection.items = await this.itemRepo.find({ where: { inspectionId: id } });
    }
    return inspection;
  }

  async findBySchedule(scheduleId: string) {
    return this.inspectionRepo.find({ where: { scheduleId }, order: { createdAt: 'DESC' } });
  }

  async findByType(type: InspectionType) {
    return this.inspectionRepo.find({ where: { type }, order: { createdAt: 'DESC' } });
  }

  async addItems(inspectionId: string, items: Partial<InspectionItem>[]) {
    const savedItems = items.map((item) => this.itemRepo.create({ ...item, inspectionId }));
    return this.itemRepo.save(savedItems);
  }

  async updateItem(id: string, data: Partial<InspectionItem>) {
    await this.itemRepo.update(id, data);
    return this.itemRepo.findOne({ where: { id } });
  }

  async getReturnInspectionWithDeductions(scheduleId: string) {
    const inspections = await this.inspectionRepo.find({
      where: { scheduleId, type: InspectionType.RETURN },
      order: { createdAt: 'DESC' },
    });
    const result: (Inspection & { items: InspectionItem[] })[] = [];
    for (const insp of inspections) {
      const items = await this.itemRepo.find({ where: { inspectionId: insp.id } });
      const withDeductions = items.filter((i) => i.damageType && i.damageType !== DamageType.NORMAL_WEAR && i.deductionAmount > 0);
      if (withDeductions.length > 0) {
        result.push({ ...insp, items: withDeductions });
      }
    }
    return result;
  }
}
