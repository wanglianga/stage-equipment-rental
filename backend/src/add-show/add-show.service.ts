import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AddShowRequest,
  AddShowRequestStatus,
  CheckItemStatus,
  CheckResult,
  Project,
  ProjectStatus,
  Schedule,
  ScheduleStatus,
  Equipment,
  VenueConfirmation,
  Settlement,
  User,
  UserRole,
} from '../entities';

interface AddShowRequestData {
  projectId: string;
  requestedBy: string;
  additionalPerformanceDates: string[];
  requestedEquipment?: { equipmentId: string; quantity: number }[];
  notes?: string;
}

@Injectable()
export class AddShowService {
  constructor(
    @InjectRepository(AddShowRequest)
    private addShowRepo: Repository<AddShowRequest>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Equipment)
    private equipmentRepo: Repository<Equipment>,
    @InjectRepository(VenueConfirmation)
    private venueRepo: Repository<VenueConfirmation>,
    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createRequest(data: AddShowRequestData) {
    const project = await this.projectRepo.findOne({ where: { id: data.projectId } });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.status === ProjectStatus.CANCELLED) {
      throw new BadRequestException('项目已取消，无法加场');
    }

    const request = this.addShowRepo.create({
      ...data,
      status: AddShowRequestStatus.PENDING,
    });

    return this.addShowRepo.save(request);
  }

  async findAll() {
    return this.addShowRepo.find({
      relations: ['project', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.addShowRepo.findOne({
      where: { id },
      relations: ['project', 'requester'],
    });
  }

  async findByProject(projectId: string) {
    return this.addShowRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async performChecks(requestId: string) {
    const request = await this.addShowRepo.findOne({
      where: { id: requestId },
      relations: ['project'],
    });

    if (!request) {
      throw new NotFoundException('加场请求不存在');
    }

    request.status = AddShowRequestStatus.CHECKING;
    await this.addShowRepo.save(request);

    const checkResult: CheckResult = {
      equipmentOccupancy: CheckItemStatus.PENDING,
      venueWindow: CheckItemStatus.PENDING,
      technicianAvailability: CheckItemStatus.PENDING,
      depositSupplement: CheckItemStatus.PENDING,
      details: {},
    };

    const equipmentCheck = await this.checkEquipmentOccupancy(request);
    checkResult.equipmentOccupancy = equipmentCheck.status;
    checkResult.details.equipmentConflicts = equipmentCheck.conflicts;

    const venueCheck = await this.checkVenueWindow(request);
    checkResult.venueWindow = venueCheck.status;
    checkResult.details.venueConflicts = venueCheck.conflicts;

    const techCheck = await this.checkTechnicianAvailability(request);
    checkResult.technicianAvailability = techCheck.status;
    checkResult.details.unavailableTechnicians = techCheck.unavailable;

    const depositCheck = await this.calculateDepositSupplement(request);
    checkResult.depositSupplement = depositCheck.status;
    checkResult.details.requiredDeposit = depositCheck.requiredDeposit;
    checkResult.details.currentDeposit = depositCheck.currentDeposit;
    checkResult.details.additionalDeposit = depositCheck.additionalDeposit;

    request.checkResult = checkResult;
    request.additionalDeposit = depositCheck.additionalDeposit || 0;

    const allPass =
      checkResult.equipmentOccupancy === CheckItemStatus.PASS &&
      checkResult.venueWindow === CheckItemStatus.PASS &&
      checkResult.technicianAvailability === CheckItemStatus.PASS &&
      checkResult.depositSupplement !== CheckItemStatus.FAIL;

    if (allPass) {
      request.status = AddShowRequestStatus.APPROVED;
      const timeAdj = await this.calculateTimeAdjustment(request);
      request.timeAdjustment = timeAdj;
      request.approvedEquipment = request.requestedEquipment || request.project.equipmentList;
      await this.updateSupplierStockList(request);
      await this.calculateAdditionalFees(request);
    } else if (
      checkResult.equipmentOccupancy === CheckItemStatus.WARNING ||
      checkResult.venueWindow === CheckItemStatus.WARNING
    ) {
      request.status = AddShowRequestStatus.PARTIAL_APPROVED;
      const partialEquipment = await this.getAvailableEquipment(request);
      request.approvedEquipment = partialEquipment;
      const alternatives = await this.findAlternativeEquipment(request);
      request.alternativeEquipments = alternatives;
      await this.updateSupplierStockList(request);
    } else {
      request.status = AddShowRequestStatus.REJECTED;
      request.rejectionReason = '资源检查未通过，请查看详细信息';
    }

    return this.addShowRepo.save(request);
  }

  private async checkEquipmentOccupancy(request: AddShowRequest) {
    const project = request.project;
    const allDates = [...project.performanceDates, ...request.additionalPerformanceDates];
    const startDate = allDates.sort()[0];
    const endDate = allDates.sort().reverse()[0];

    const conflicts: any[] = [];
    const equipmentList = request.requestedEquipment || project.equipmentList || [];

    for (const item of equipmentList) {
      const overlappingSchedules = await this.scheduleRepo
        .createQueryBuilder('schedule')
        .innerJoinAndSelect('schedule.project', 'project')
        .where('schedule.equipmentId = :equipmentId', { equipmentId: item.equipmentId })
        .andWhere('schedule.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
        .andWhere('schedule.projectId != :projectId', { projectId: project.id })
        .andWhere(
          '(schedule.startDate <= :endDate AND schedule.endDate >= :startDate)',
          { startDate, endDate }
        )
        .getMany();

      if (overlappingSchedules.length > 0) {
        const equipment = await this.equipmentRepo.findOne({ where: { id: item.equipmentId } });
        conflicts.push({
          equipmentId: item.equipmentId,
          equipmentName: equipment?.name || '未知设备',
          conflictProject: overlappingSchedules[0].project.name,
          conflictDates: overlappingSchedules.map(s => `${s.startDate} - ${s.endDate}`),
        });
      }
    }

    return {
      status: conflicts.length === 0 ? CheckItemStatus.PASS : CheckItemStatus.WARNING,
      conflicts,
    };
  }

  private async checkVenueWindow(request: AddShowRequest) {
    const project = request.project;
    const conflicts: any[] = [];

    const venueConfirmations = await this.venueRepo.find({
      where: { projectId: project.id },
    });

    if (venueConfirmations.length === 0) {
      return { status: CheckItemStatus.WARNING, conflicts: [{ date: 'N/A', reason: '未找到剧院确认信息' }] };
    }

    for (const date of request.additionalPerformanceDates) {
      const dt = new Date(date);
      const dayOfWeek = dt.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const setupWindow = venueConfirmations[0].setupWindow;
      if (setupWindow) {
        const windowStart = new Date(setupWindow.start);
        const windowEnd = new Date(setupWindow.end);
        if (dt < windowStart || dt > windowEnd) {
          conflicts.push({
            date,
            reason: `日期超出装台窗口范围 (${setupWindow.start} - ${setupWindow.end})`,
          });
        }
      }

      if (isWeekend) {
        conflicts.push({
          date,
          reason: '周末装台需额外确认，可能产生附加费用',
        });
      }
    }

    return {
      status: conflicts.length === 0 ? CheckItemStatus.PASS : CheckItemStatus.WARNING,
      conflicts,
    };
  }

  private async checkTechnicianAvailability(request: AddShowRequest) {
    const project = request.project;
    const unavailable: any[] = [];

    const venueConfirmations = await this.venueRepo.find({
      where: { projectId: project.id },
      relations: ['technician'],
    });

    const allDates = [...project.performanceDates, ...request.additionalPerformanceDates];
    const startDate = allDates.sort()[0];
    const endDate = allDates.sort().reverse()[0];

    for (const vc of venueConfirmations) {
      const otherAssignments = await this.venueRepo
        .createQueryBuilder('vc')
        .innerJoinAndSelect('vc.project', 'project')
        .where('vc.technicianId = :techId', { techId: vc.technicianId })
        .andWhere('vc.projectId != :projectId', { projectId: project.id })
        .andWhere('project.performanceDates LIKE :startDate', { startDate: `%${startDate}%` })
        .getCount();

      if (otherAssignments > 0) {
        unavailable.push({
          technicianId: vc.technicianId,
          name: vc.technician?.name || '未知技术人员',
          reason: `该技术人员在 ${startDate} - ${endDate} 期间已有其他安排`,
        });
      }
    }

    const suppliers = await this.userRepo.find({ where: { role: UserRole.SUPPLIER } });
    for (const supplier of suppliers) {
      const supplierEquipments = await this.equipmentRepo.find({ where: { supplierId: supplier.id } });
      const hasEquipment = supplierEquipments.some(e =>
        (request.requestedEquipment || project.equipmentList || []).some(r => r.equipmentId === e.id)
      );

      if (hasEquipment) {
        const supplierProjects = await this.projectRepo
          .createQueryBuilder('p')
          .where('p.brokerId != :brokerId', { brokerId: project.brokerId })
          .andWhere('p.status != :cancelled', { cancelled: ProjectStatus.CANCELLED })
          .andWhere('p.performanceDates LIKE :date', { date: `%${startDate}%` })
          .getCount();

        if (supplierProjects >= 3) {
          unavailable.push({
            technicianId: supplier.id,
            name: supplier.name + '(供应商)',
            reason: '供应商在此期间项目过多，可能无法补派技术人员',
          });
        }
      }
    }

    return {
      status: unavailable.length === 0 ? CheckItemStatus.PASS : CheckItemStatus.WARNING,
      unavailable,
    };
  }

  private async calculateDepositSupplement(request: AddShowRequest) {
    const project = request.project;
    const equipmentList = request.requestedEquipment || project.equipmentList || [];

    let totalRequiredDeposit = 0;
    for (const item of equipmentList) {
      const equipment = await this.equipmentRepo.findOne({ where: { id: item.equipmentId } });
      if (equipment) {
        totalRequiredDeposit += equipment.deposit * item.quantity;
      }
    }

    const extraDays = request.additionalPerformanceDates.length;
    totalRequiredDeposit = totalRequiredDeposit * (1 + extraDays * 0.2);

    const settlements = await this.settlementRepo.find({ where: { projectId: project.id } });
    const currentDeposit = settlements.reduce((sum, s) => sum + s.totalDeposit, 0);

    const additionalDeposit = Math.max(0, totalRequiredDeposit - currentDeposit);

    return {
      status: additionalDeposit > 0 ? CheckItemStatus.WARNING : CheckItemStatus.PASS,
      requiredDeposit: totalRequiredDeposit,
      currentDeposit,
      additionalDeposit,
    };
  }

  private async calculateTimeAdjustment(request: AddShowRequest) {
    const project = request.project;
    const extraDays = request.additionalPerformanceDates.length;

    const originalEnd = project.performanceDates.sort().reverse()[0];
    const newEnd = this.addDays(originalEnd, extraDays);

    let rehearsalStart = project.rehearsalPeriod?.start || originalEnd;
    let rehearsalEnd = project.rehearsalPeriod?.end || originalEnd;
    rehearsalEnd = this.addDays(rehearsalEnd, extraDays);

    const outboundDate = this.addDays(rehearsalStart, -1);
    const setupDate = rehearsalStart;
    const returnDate = this.addDays(newEnd, 1);

    return {
      rehearsalPeriod: { start: rehearsalStart, end: rehearsalEnd },
      outboundDate,
      setupDate,
      returnDate,
    };
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private async getAvailableEquipment(request: AddShowRequest) {
    const project = request.project;
    const allDates = [...project.performanceDates, ...request.additionalPerformanceDates];
    const startDate = allDates.sort()[0];
    const endDate = allDates.sort().reverse()[0];

    const equipmentList = request.requestedEquipment || project.equipmentList || [];
    const available: { equipmentId: string; quantity: number }[] = [];

    for (const item of equipmentList) {
      const equipment = await this.equipmentRepo.findOne({ where: { id: item.equipmentId } });
      if (!equipment) continue;

      const usedSchedules = await this.scheduleRepo
        .createQueryBuilder('s')
        .where('s.equipmentId = :equipId', { equipId: item.equipmentId })
        .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
        .andWhere('s.projectId != :projectId', { projectId: project.id })
        .andWhere('(s.startDate <= :endDate AND s.endDate >= :startDate)', { startDate, endDate })
        .getMany();

      const usedQuantity = usedSchedules.reduce((sum, s) => sum + s.quantity, 0);
      const availableQty = Math.max(0, equipment.totalQuantity - usedQuantity);
      const approvedQty = Math.min(item.quantity, availableQty);

      if (approvedQty > 0) {
        available.push({ equipmentId: item.equipmentId, quantity: approvedQty });
      }
    }

    return available;
  }

  private async findAlternativeEquipment(request: AddShowRequest) {
    const project = request.project;
    const approved = request.approvedEquipment || [];
    const original = request.requestedEquipment || project.equipmentList || [];

    const alternatives: any[] = [];

    for (const orig of original) {
      const approvedItem = approved.find(a => a.equipmentId === orig.equipmentId);
      const shortage = orig.quantity - (approvedItem?.quantity || 0);

      if (shortage > 0) {
        const origEquip = await this.equipmentRepo.findOne({ where: { id: orig.equipmentId } });
        if (!origEquip) continue;

        const alternativesForCategory = await this.equipmentRepo.find({
          where: { category: origEquip.category },
        });

        for (const alt of alternativesForCategory) {
          if (alt.id === orig.equipmentId) continue;
          if (alt.availableQuantity >= shortage) {
            alternatives.push({
              originalEquipmentId: orig.equipmentId,
              originalEquipmentName: origEquip.name,
              alternativeEquipmentId: alt.id,
              alternativeEquipmentName: alt.name,
              quantity: shortage,
              priceDifference: alt.dailyRate - origEquip.dailyRate,
            });
            break;
          }
        }
      }
    }

    return alternatives;
  }

  private async updateSupplierStockList(request: AddShowRequest) {
    const approved = request.approvedEquipment || [];
    const stockList: any[] = [];

    for (const item of approved) {
      const equipment = await this.equipmentRepo.findOne({
        where: { id: item.equipmentId },
        relations: ['supplier'],
      });
      if (equipment) {
        stockList.push({
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          quantity: item.quantity,
          supplierId: equipment.supplierId,
        });
      }
    }

    request.supplierStockList = stockList;
  }

  private async calculateAdditionalFees(request: AddShowRequest) {
    const extraDays = request.additionalPerformanceDates.length;
    const approved = request.approvedEquipment || [];

    let additionalRentalFee = 0;
    for (const item of approved) {
      const equipment = await this.equipmentRepo.findOne({ where: { id: item.equipmentId } });
      if (equipment) {
        additionalRentalFee += equipment.dailyRate * item.quantity * extraDays;
      }
    }

    request.additionalRentalFee = additionalRentalFee;
  }

  async confirmAlternative(requestId: string, confirmed: boolean, selectedAlternatives?: any[]) {
    const request = await this.addShowRepo.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('加场请求不存在');
    }

    if (request.status !== AddShowRequestStatus.PARTIAL_APPROVED) {
      throw new BadRequestException('当前状态不需要确认替代方案');
    }

    if (confirmed && selectedAlternatives) {
      request.alternativeEquipments = selectedAlternatives;
      for (const alt of selectedAlternatives) {
        const existing = request.approvedEquipment?.find(e => e.equipmentId === alt.alternativeEquipmentId);
        if (existing) {
          existing.quantity += alt.quantity;
        } else {
          request.approvedEquipment = [
            ...(request.approvedEquipment || []),
            { equipmentId: alt.alternativeEquipmentId, quantity: alt.quantity },
          ];
        }
      }
      await this.updateSupplierStockList(request);
      await this.calculateAdditionalFees(request);
      request.status = AddShowRequestStatus.APPROVED;
    }

    request.alternativeConfirmed = confirmed;
    return this.addShowRepo.save(request);
  }

  async approve(requestId: string) {
    const request = await this.addShowRepo.findOne({
      where: { id: requestId },
      relations: ['project'],
    });

    if (!request) {
      throw new NotFoundException('加场请求不存在');
    }

    if (request.status === AddShowRequestStatus.PARTIAL_APPROVED && !request.alternativeConfirmed) {
      throw new BadRequestException('请先确认替代方案');
    }

    const project = request.project;
    project.performanceDates = [...project.performanceDates, ...request.additionalPerformanceDates];

    if (request.timeAdjustment) {
      project.rehearsalPeriod = request.timeAdjustment.rehearsalPeriod;
    }

    if (request.approvedEquipment) {
      project.equipmentList = request.approvedEquipment;
    }

    await this.projectRepo.save(project);

    if (request.timeAdjustment) {
      const schedules = await this.scheduleRepo.find({ where: { projectId: project.id } });
      for (const schedule of schedules) {
        schedule.endDate = request.timeAdjustment.returnDate;
        await this.scheduleRepo.save(schedule);
      }
    }

    request.status = AddShowRequestStatus.CONFIRMED;
    return this.addShowRepo.save(request);
  }

  async reject(requestId: string, reason: string) {
    const request = await this.addShowRepo.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('加场请求不存在');
    }

    request.status = AddShowRequestStatus.REJECTED;
    request.rejectionReason = reason;
    return this.addShowRepo.save(request);
  }
}
