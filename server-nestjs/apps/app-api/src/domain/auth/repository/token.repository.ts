import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { UserRefreshToken, User } from '@app/entity/entities';

@Injectable()
export class TokenRepository {
  constructor(
    @InjectRepository(UserRefreshToken)
    private readonly tokenRepository: Repository<UserRefreshToken>,
  ) {}

  async saveRefreshToken(
    data: { jti: string; user: User; expiresAt: Date },
    queryRunner?: QueryRunner,
  ): Promise<UserRefreshToken> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserRefreshToken)
      : this.tokenRepository;

    const token = repo.create({
      jti: data.jti,
      userId: data.user.id,
      expiresAt: data.expiresAt,
      isRevoked: false,
    });

    return repo.save(token);
  }

  async findRefreshTokenByJti(
    jti: string,
    queryRunner?: QueryRunner,
  ): Promise<UserRefreshToken | null> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserRefreshToken)
      : this.tokenRepository;

    return repo.findOne({
      where: { jti, isRevoked: false },
      relations: ['user'],
    });
  }

  async revokeRefreshToken(jti: string, queryRunner?: QueryRunner): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserRefreshToken)
      : this.tokenRepository;

    await repo.update({ jti }, { isRevoked: true });
  }

  async revokeAllUserRefreshTokens(userId: string, queryRunner?: QueryRunner): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(UserRefreshToken)
      : this.tokenRepository;

    await repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
