import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EquipmentModule } from './equipment/equipment.module';
import { SchedulesModule } from './schedules/schedules.module';
import { InspectionsModule } from './inspections/inspections.module';
import { VenueModule } from './venue/venue.module';
import { SettlementsModule } from './settlements/settlements.module';
import { SeedService } from './seed.service';
import { User, Project, Equipment, Schedule, VenueConfirmation, Inspection, InspectionItem, Settlement, SettlementItem } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: 'data/stage-rental.db',
      autoSave: true,
      entities: [User, Project, Equipment, Schedule, VenueConfirmation, Inspection, InspectionItem, Settlement, SettlementItem],
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    ProjectsModule,
    EquipmentModule,
    SchedulesModule,
    InspectionsModule,
    VenueModule,
    SettlementsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
