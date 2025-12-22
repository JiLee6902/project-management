import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { User, UserStatus, AuthProvider } from '@app/entity/entities';

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

  async findUserByProvider(
    provider: AuthProvider,
    providerId: string,
    queryRunner?: QueryRunner,
  ): Promise<User | null> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    return repo.findOne({ where: { provider, providerId } });
  }

  async createOAuthUser(
    data: {
      email: string;
      name?: string;
      image?: string;
      provider: AuthProvider;
      providerId: string;
    },
    queryRunner?: QueryRunner,
  ): Promise<User> {
    const repo = queryRunner ? queryRunner.manager.getRepository(User) : this.userRepository;
    const user = repo.create({
      email: data.email,
      name: data.name || data.email.split('@')[0],
      image: data.image,
      provider: data.provider,
      providerId: data.providerId,
      status: UserStatus.ACTIVE,
    });
    return repo.save(user);
  }

  async findOrCreateOAuthUser(
    data: {
      email: string;
      name?: string;
      image?: string;
      provider: AuthProvider;
      providerId: string;
    },
    queryRunner?: QueryRunner,
  ): Promise<{ user: User; isNew: boolean }> {
    // First check by provider and providerId
    let user = await this.findUserByProvider(data.provider, data.providerId, queryRunner);

    if (user) {
      // Update user info if changed
      const updates: Partial<User> = {};
      if (data.name && user.name !== data.name) updates.name = data.name;
      if (data.image && user.image !== data.image) updates.image = data.image;

      if (Object.keys(updates).length > 0) {
        await this.updateUser(user.id, updates, queryRunner);
        user = { ...user, ...updates };
      }

      return { user, isNew: false };
    }

    // Check if email exists with different provider
    const existingUserByEmail = await this.findUserByEmail(data.email, queryRunner);

    if (existingUserByEmail) {
      // Link the OAuth provider to existing account
      await this.updateUser(
        existingUserByEmail.id,
        {
          provider: data.provider,
          providerId: data.providerId,
          image: data.image || existingUserByEmail.image,
        },
        queryRunner,
      );
      return {
        user: {
          ...existingUserByEmail,
          provider: data.provider,
          providerId: data.providerId,
        },
        isNew: false,
      };
    }

    // Create new user
    const newUser = await this.createOAuthUser(data, queryRunner);
    return { user: newUser, isNew: true };
  }
}
