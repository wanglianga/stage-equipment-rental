import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { EquipmentService } from './equipment/equipment.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private usersService: UsersService,
    private equipmentService: EquipmentService,
  ) {}

  async onModuleInit() {
    try {
      await this.usersService.seed();
      this.logger.log('默认用户已初始化（broker1/tech1/supplier1）');
      await this.equipmentService.seed();
      this.logger.log('默认设备已初始化（12种舞台设备）');
    } catch (e) {
      this.logger.warn('种子数据初始化异常: ' + e.message);
    }
  }
}
