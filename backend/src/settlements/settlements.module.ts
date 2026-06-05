import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement, SettlementItem } from '../entities';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { SchedulesModule } from '../schedules/schedules.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, SettlementItem]), SchedulesModule, InspectionsModule],
  providers: [SettlementsService],
  controllers: [SettlementsController],
  exports: [SettlementsService],
})
export class SettlementsModule {}
