import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../entities';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule]), EquipmentModule],
  providers: [SchedulesService],
  controllers: [SchedulesController],
  exports: [SchedulesService],
})
export class SchedulesModule {}
