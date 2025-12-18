import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { User, UserStatus } from '@app/entity/entities';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string, queryRunner?: QueryRunner): Promise<User | null> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    return repo.findOne({ where: { email } });
  }

  async findUserById(userId: string, queryRunner?: QueryRunner): Promise<User | null> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    return repo.findOne({ where: { id: userId } });
  }

  async createUser(
    data: { email: string; password: string; name?: string },
    queryRunner?: QueryRunner,
  ): Promise<User> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    const user = repo.create({
      email: data.email,
      password: data.password,
      name: data.name || data.email.split('@')[0],
      status: UserStatus.ACTIVE,
    });
    return repo.save(user);
  }

  async updateUser(
    userId: string,
    data: Partial<User>,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    await repo.update(userId, data);
  }
}
