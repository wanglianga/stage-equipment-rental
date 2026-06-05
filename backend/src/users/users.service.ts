import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async create(data: Partial<User> & { username: string; password: string; role: UserRole; name: string }) {
    const hashed = crypto.createHash('sha256').update(data.password).digest('hex');
    const user = this.repo.create({ ...data, password: hashed });
    return this.repo.save(user);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByRole(role: UserRole) {
    return this.repo.find({ where: { role } });
  }

  async validate(username: string, password: string) {
    const hashed = crypto.createHash('sha256').update(password).digest('hex');
    const user = await this.repo.findOne({ where: { username, password: hashed } });
    return user;
  }

  async seed() {
    const count = await this.repo.count();
    if (count > 0) return;
    await this.create({ username: 'broker1', password: '123456', role: UserRole.BROKER, name: '张经纪', company: '星光演出经纪' });
    await this.create({ username: 'tech1', password: '123456', role: UserRole.TECHNICIAN, name: '李技术', company: '大剧院技术部' });
    await this.create({ username: 'supplier1', password: '123456', role: UserRole.SUPPLIER, name: '王供应', company: '鼎盛灯光音响' });
  }
}
