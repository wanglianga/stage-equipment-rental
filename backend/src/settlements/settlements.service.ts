import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement, SettlementItem, SettlementStatus, DamageType, Inspection, InspectionItem } from '../entities';
import { SchedulesService } from '../schedules/schedules.service';
import { InspectionsService } from '../inspections/inspections.service';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,
    @InjectRepository(SettlementItem)
    private itemRepo: Repository<SettlementItem>,
    private schedulesService: SchedulesService,
    private inspectionsService: InspectionsService,
  ) {}

  async create(projectId: string) {
    const schedules = await this.schedulesService.findByProject(projectId);
    const rentalItems: Partial<SettlementItem>[] = [];
    let totalRentalFee = 0;
    let totalDeposit = 0;
    let totalDeduction = 0;

    for (const schedule of schedules) {
      if (schedule.status === 'cancelled') continue;
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const rentalFee = schedule.quantity * rentalDays * (schedule.equipment?.dailyRate || 0);
      const depositFee = schedule.quantity * (schedule.equipment?.deposit || 0);
      totalRentalFee += rentalFee;
      totalDeposit += depositFee;

      rentalItems.push({
        equipmentId: schedule.equipmentId,
        quantity: schedule.quantity,
        rentalDays,
        rentalFee,
        deductionAmount: 0,
      });

      const deductions = await this.inspectionsService.getReturnInspectionWithDeductions(schedule.id);
      for (const ded of deductions) {
        for (const item of ded.items || []) {
          totalDeduction += item.deductionAmount;
          rentalItems.push({
            equipmentId: item.equipmentId,
            quantity: 1,
            rentalDays: 0,
            rentalFee: 0,
            deductionType: item.damageType,
            deductionAmount: item.deductionAmount,
            inspectionItemId: item.id,
            responsibility: item.responsibility,
            photoUrl: (item.photoUrls && item.photoUrls[0]) || undefined,
          });
        }
      }
    }

    const settlement = this.settlementRepo.create({
      projectId,
      totalRentalFee,
      totalDeposit,
      totalDeduction,
      finalAmount: totalRentalFee + totalDeduction,
    });
    const saved = await this.settlementRepo.save(settlement);

    const items = rentalItems.map((item) => this.itemRepo.create({ ...item, settlementId: saved.id }));
    saved.items = await this.itemRepo.save(items);

    return saved;
  }

  async findAll() {
    return this.settlementRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const settlement = await this.settlementRepo.findOne({ where: { id } });
    if (settlement) {
      settlement.items = await this.itemRepo.find({ where: { settlementId: id } });
    }
    return settlement;
  }

  async findByProject(projectId: string) {
    return this.settlementRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: SettlementStatus) {
    await this.settlementRepo.update(id, { status });
    return this.settlementRepo.findOne({ where: { id } });
  }

  async updateItem(id: string, data: Partial<SettlementItem>) {
    await this.itemRepo.update(id, data);
    const item = await this.itemRepo.findOne({ where: { id } });
    if (item) {
      const allItems = await this.itemRepo.find({ where: { settlementId: item.settlementId } });
      const totalDeduction = allItems.reduce((sum, i) => sum + i.deductionAmount, 0);
      const totalRentalFee = allItems.reduce((sum, i) => sum + i.rentalFee, 0);
      await this.settlementRepo.update(item.settlementId, {
        totalDeduction,
        totalRentalFee,
        finalAmount: totalRentalFee + totalDeduction,
      });
    }
    return item;
  }
}
