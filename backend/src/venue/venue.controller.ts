import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { VenueService } from './venue.service';
import { VenueConfirmation } from '../entities';

@Controller('venue')
export class VenueController {
  constructor(private service: VenueService) {}

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

  @Post()
  create(@Body() data: Partial<VenueConfirmation>) {
    return this.service.create(data);
  }

  @Put(':id/confirm')
  confirm(@Param('id') id: string, @Body() data: Partial<VenueConfirmation>) {
    return this.service.confirm(id, data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<VenueConfirmation>) {
    return this.service.update(id, data);
  }
}
