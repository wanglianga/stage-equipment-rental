import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from '../entities';

@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('broker/:brokerId')
  findByBroker(@Param('brokerId') brokerId: string) {
    return this.service.findByBroker(brokerId);
  }

  @Post()
  create(@Body() data: Partial<Project>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Project>) {
    return this.service.update(id, data);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: ProjectStatus }) {
    return this.service.updateStatus(id, body.status);
  }
}
