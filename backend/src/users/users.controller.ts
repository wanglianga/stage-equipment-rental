import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../entities';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('role/:role')
  findByRole(@Param('role') role: UserRole) {
    return this.service.findByRole(role);
  }

  @Post()
  create(@Body() data: Partial<User> & { username: string; password: string; role: UserRole; name: string }) {
    return this.service.create(data);
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.service.validate(body.username, body.password);
    if (!user) return { success: false, message: '用户名或密码错误' };
    return { success: true, user };
  }

  @Post('seed')
  seed() {
    return this.service.seed();
  }
}
