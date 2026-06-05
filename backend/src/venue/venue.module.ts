import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenueConfirmation } from '../entities';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VenueConfirmation])],
  providers: [VenueService],
  controllers: [VenueController],
  exports: [VenueService],
})
export class VenueModule {}
