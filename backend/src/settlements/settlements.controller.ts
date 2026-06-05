import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { Settlement, SettlementItem, SettlementStatus } from '../entities';

@Controller('settlements')
export class SettlementsController {
  constructor(private service: SettlementsService) {}

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

  @Post('project/:projectId/generate')
  generate(@Param('projectId') projectId: string) {
    return this.service.create(projectId);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: SettlementStatus }) {
    return this.service.updateStatus(id, body.status);
  }

  @Put('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() data: Partial<SettlementItem>) {
    return this.service.updateItem(itemId, data);
  }
}
