import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['organization'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ['organization'] });
  }

  async create(userData: Partial<User>, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const user = repo.create(userData);
    return repo.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }
}
