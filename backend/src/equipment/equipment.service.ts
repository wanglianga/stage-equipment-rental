import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentCategory } from '../entities';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private repo: Repository<Equipment>,
  ) {}

  async create(data: Partial<Equipment>) {
    const equip = this.repo.create({ ...data, availableQuantity: data.totalQuantity || 0 });
    return this.repo.save(equip);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findBySupplier(supplierId: string) {
    return this.repo.find({ where: { supplierId }, order: { createdAt: 'DESC' } });
  }

  async findByCategory(category: EquipmentCategory) {
    return this.repo.find({ where: { category } });
  }

  async update(id: string, data: Partial<Equipment>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async updateAvailability(id: string, delta: number) {
    const equip = await this.repo.findOne({ where: { id } });
    if (!equip) return null;
    equip.availableQuantity = Math.max(0, equip.availableQuantity + delta);
    return this.repo.save(equip);
  }

  async seed() {
    const count = await this.repo.count();
    if (count > 0) return;
    const supplierId = 'seed';
    const items = [
      { name: 'MAC Aura XB', category: EquipmentCategory.LIGHTING, brand: 'Martin', model: 'Aura XB', dailyRate: 300, deposit: 2000, totalQuantity: 12 },
      { name: 'Sharpy Plus', category: EquipmentCategory.LIGHTING, brand: 'Clay Paky', model: 'Sharpy Plus', dailyRate: 500, deposit: 5000, totalQuantity: 8 },
      { name: 'd&b V-Series', category: EquipmentCategory.AUDIO, brand: 'd&b', model: 'V8+V-SUB', dailyRate: 800, deposit: 8000, totalQuantity: 4 },
      { name: 'Meyer Sound LEOPARD', category: EquipmentCategory.AUDIO, brand: 'Meyer', model: 'LEOPARD', dailyRate: 600, deposit: 6000, totalQuantity: 6 },
      { name: 'grandMA3 Light', category: EquipmentCategory.CONSOLE, brand: 'MA', model: 'grandMA3 Light', dailyRate: 1000, deposit: 15000, totalQuantity: 2 },
      { name: 'Yamaha CL5', category: EquipmentCategory.CONSOLE, brand: 'Yamaha', model: 'CL5', dailyRate: 800, deposit: 12000, totalQuantity: 2 },
      { name: '4芯音频线 30m', category: EquipmentCategory.CABLE, brand: 'Mogami', model: '4芯-30m', dailyRate: 5, deposit: 50, totalQuantity: 50 },
      { name: 'DMX信号线 15m', category: EquipmentCategory.CABLE, brand: 'SSAC', model: 'DMX-15m', dailyRate: 3, deposit: 30, totalQuantity: 80 },
      { name: '灯光桁架 3m', category: EquipmentCategory.STAND, brand: 'Applied', model: 'TR-3m', dailyRate: 50, deposit: 500, totalQuantity: 30 },
      { name: '音箱支架', category: EquipmentCategory.STAND, brand: 'K&M', model: 'SP-1', dailyRate: 10, deposit: 100, totalQuantity: 20 },
      { name: '灯控台运输箱', category: EquipmentCategory.CASE, brand: 'Custom', model: 'CON-Case', dailyRate: 20, deposit: 200, totalQuantity: 6 },
      { name: '音箱运输箱', category: EquipmentCategory.CASE, brand: 'Custom', model: 'SPK-Case', dailyRate: 15, deposit: 150, totalQuantity: 10 },
    ];
    for (const item of items) {
      await this.create({ ...item, supplierId, specs: {}, depositTerms: {} });
    }
  }
}
