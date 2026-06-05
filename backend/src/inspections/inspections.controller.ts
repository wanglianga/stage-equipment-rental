import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { Inspection, InspectionItem, InspectionType } from '../entities';

@Controller('inspections')
export class InspectionsController {
  constructor(private service: InspectionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('schedule/:scheduleId')
  findBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.service.findBySchedule(scheduleId);
  }

  @Get('type/:type')
  findByType(@Param('type') type: InspectionType) {
    return this.service.findByType(type);
  }

  @Get('deductions/:scheduleId')
  getReturnInspectionWithDeductions(@Param('scheduleId') scheduleId: string) {
    return this.service.getReturnInspectionWithDeductions(scheduleId);
  }

  @Post()
  create(@Body() data: Partial<Inspection> & { items?: Partial<InspectionItem>[] }) {
    return this.service.create(data);
  }

  @Post(':id/items')
  addItems(@Param('id') id: string, @Body() items: Partial<InspectionItem>[]) {
    return this.service.addItems(id, items);
  }

  @Put('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() data: Partial<InspectionItem>) {
    return this.service.updateItem(itemId, data);
  }
}
