import { Controller, Get, Post, Put, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AddShowService } from './add-show.service';

@Controller('add-show')
export class AddShowController {
  constructor(private readonly addShowService: AddShowService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: any) {
    return this.addShowService.createRequest(data);
  }

  @Get()
  findAll() {
    return this.addShowService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addShowService.findOne(id);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.addShowService.findByProject(projectId);
  }

  @Post(':id/check')
  @HttpCode(HttpStatus.OK)
  performChecks(@Param('id') id: string) {
    return this.addShowService.performChecks(id);
  }

  @Post(':id/confirm-alternative')
  @HttpCode(HttpStatus.OK)
  confirmAlternative(@Param('id') id: string, @Body() body: { confirmed: boolean; selectedAlternatives?: any[] }) {
    return this.addShowService.confirmAlternative(id, body.confirmed, body.selectedAlternatives);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string) {
    return this.addShowService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.addShowService.reject(id, body.reason);
  }
}
