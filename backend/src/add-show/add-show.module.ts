import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddShowController } from './add-show.controller';
import { AddShowService } from './add-show.service';
import {
  AddShowRequest,
  Project,
  Schedule,
  Equipment,
  VenueConfirmation,
  Settlement,
  User,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AddShowRequest,
      Project,
      Schedule,
      Equipment,
      VenueConfirmation,
      Settlement,
      User,
    ]),
  ],
  controllers: [AddShowController],
  providers: [AddShowService],
  exports: [AddShowService],
})
export class AddShowModule {}
