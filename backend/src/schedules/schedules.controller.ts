import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule } from '../entities';

@Controller('schedules')
export class SchedulesController {
  constructor(private service: SchedulesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get('equipment/:equipmentId')
  findByEquipment(@Param('equipmentId') equipmentId: string) {
    return this.service.findByEquipment(equipmentId);
  }

  @Post()
  create(@Body() data: Partial<Schedule>) {
    return this.service.create(data);
  }

  @Put(':id/lock')
  lock(@Param('id') id: string) {
    return this.service.lock(id);
  }

  @Put(':id/outbound')
  markOutbound(@Param('id') id: string) {
    return this.service.markOutbound(id);
  }

  @Put(':id/setup')
  markSetup(@Param('id') id: string) {
    return this.service.markSetup(id);
  }

  @Put(':id/return')
  markReturned(@Param('id') id: string) {
    return this.service.markReturned(id);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
