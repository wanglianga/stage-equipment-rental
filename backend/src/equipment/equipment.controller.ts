import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { Equipment, EquipmentCategory } from '../entities';

@Controller('equipment')
export class EquipmentController {
  constructor(private service: EquipmentService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('supplier/:supplierId')
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(supplierId);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: EquipmentCategory) {
    return this.service.findByCategory(category);
  }

  @Post()
  create(@Body() data: Partial<Equipment>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Equipment>) {
    return this.service.update(id, data);
  }

  @Post('seed')
  seed() {
    return this.service.seed();
  }
}
