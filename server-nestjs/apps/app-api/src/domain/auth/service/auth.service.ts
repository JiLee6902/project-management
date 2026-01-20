import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  AuthProvider,
  GuestSession,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Project,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  Priority,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '@app/entity/entities';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@app/external-infra';
import { AuthRepository } from '../repository/auth.repository';
import { TokenService } from './token.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LoginResponseDto } from '../dto';

export interface OAuthUserData {
  email: string;
  name: string;
  picture: string;
  providerId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.authRepo.findUserByEmail(
        registerDto.email,
        queryRunner,
      );

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create user
      const user = await this.authRepo.createUser(
        {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
        queryRunner,
      );

      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find user
      const user = await this.authRepo.findUserByEmail(loginDto.email, queryRunner);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    const expiresIn = Math.floor(
      this.configService.get<number>('JWT_ACCESS_EXPIRATION_MILLISECONDS', 86400000) / 1000,
    );

    const payload = this.tokenService.decodeToken(accessToken);
    const jti = (payload as any)?.jti;

    if (jti) {
      await this.redisService.addAccessTokenToBlacklist(userId, jti, expiresIn);
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Refresh token is required');
      }

      // Verify refresh token
      let decodedToken: any;
      try {
        decodedToken = this.tokenService.jwtService.verify(refreshTokenDto.refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!decodedToken?.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find refresh token in database
      const userRefreshToken = await this.tokenService.findRefreshTokenByJti(
        decodedToken.jti,
        queryRunner,
      );

      if (!userRefreshToken) {
        throw new UnauthorizedException('Refresh token not found or revoked');
      }

      // Check expiration
      if (userRefreshToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get user
      const user = await this.authRepo.findUserById(
        userRefreshToken.userId,
        queryRunner,
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Revoke old refresh token
      await this.tokenService.revokeRefreshTokenByJti(decodedToken.jti, queryRunner);

      // Generate new tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async oauthLogin(
    userData: OAuthUserData,
    provider: AuthProvider,
  ): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!userData.email) {
        throw new BadRequestException('Email is required from OAuth provider');
      }

      const { user } = await this.authRepo.findOrCreateOAuthUser(
        {
          email: userData.email,
          name: userData.name,
          image: userData.picture,
          provider,
          providerId: userData.providerId,
        },
        queryRunner,
      );

      // Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async guestLogin(ipAddress: string, deviceFingerprint?: string): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const MAX_GUEST_SESSIONS = 3;
    const GUEST_SESSION_EXPIRY_DAYS = 1;

    try {
      const guestSessionRepo = queryRunner.manager.getRepository(GuestSession);
      const userRepo = queryRunner.manager.getRepository(User);

      // STEP 1: Check if this IP + fingerprint has an existing session
      // Mỗi IP + fingerprint chỉ có 1 record duy nhất
      const existingSession = await guestSessionRepo
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.user', 'user')
        .where('session.ip_address = :ipAddress', { ipAddress })
        .andWhere(
          deviceFingerprint
            ? 'session.device_fingerprint = :fingerprint'
            : 'session.device_fingerprint IS NULL',
          { fingerprint: deviceFingerprint },
        )
        .getOne();

      if (existingSession) {
        // Check login count limit
        if (existingSession.loginCount >= MAX_GUEST_SESSIONS) {
          throw new BadRequestException(
            `Maximum ${MAX_GUEST_SESSIONS} guest logins reached. Please register for unlimited access.`,
          );
        }

        // Increment login count and update expiry
        existingSession.loginCount += 1;
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + GUEST_SESSION_EXPIRY_DAYS);
        existingSession.expiresAt = newExpiresAt;
        await guestSessionRepo.save(existingSession);

        // Generate tokens for existing user
        const [accessToken, refreshToken] = await Promise.all([
          this.tokenService.generateAccessToken(existingSession.user),
          this.tokenService.generateRefreshToken(existingSession.user, queryRunner),
        ]);

        await queryRunner.commitTransaction();

        return {
          accessToken,
          refreshToken,
          user: {
            id: existingSession.user.id,
            email: existingSession.user.email,
            name: existingSession.user.name,
          },
          isGuest: true,
          remainingSessions: MAX_GUEST_SESSIONS - existingSession.loginCount,
        } as LoginResponseDto & { isGuest: boolean; remainingSessions: number };
      }

      // STEP 2: No existing session → Check IP limit (count unique sessions per IP per day)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailySessionCount = await guestSessionRepo
        .createQueryBuilder('session')
        .where('session.ip_address = :ipAddress', { ipAddress })
        .andWhere('session.created_at >= :todayStart', { todayStart })
        .getCount();

      if (dailySessionCount >= MAX_GUEST_SESSIONS) {
        throw new BadRequestException(
          `Maximum ${MAX_GUEST_SESSIONS} guest sessions allowed per device per day. Please register for unlimited access.`,
        );
      }

      // STEP 3: Create new guest user
      const guestId = uuidv4().substring(0, 8);
      const guestEmail = `guest_${guestId}@guest.local`;
      const guestName = `Guest ${guestId.toUpperCase()}`;

      const user = userRepo.create({
        email: guestEmail,
        name: guestName,
        provider: AuthProvider.GUEST,
        password: undefined,
      });
      await userRepo.save(user);

      // STEP 4: Create guest session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_EXPIRY_DAYS);

      const guestSession = guestSessionRepo.create({
        ipAddress,
        deviceFingerprint: deviceFingerprint || undefined,
        userId: user.id,
        expiresAt,
        loginCount: 1,
      });
      await guestSessionRepo.save(guestSession);

      // STEP 5: Create seed data for guest
      await this.createGuestSeedData(user, queryRunner);

      // STEP 6: Generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(user),
        this.tokenService.generateRefreshToken(user, queryRunner),
      ]);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        isGuest: true,
        remainingSessions: MAX_GUEST_SESSIONS - dailySessionCount - 1,
      } as LoginResponseDto & { isGuest: boolean; remainingSessions: number };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createGuestSeedData(user: User, queryRunner: any): Promise<void> {
    const workspaceRepo = queryRunner.manager.getRepository(Workspace);
    const workspaceMemberRepo = queryRunner.manager.getRepository(WorkspaceMember);
    const projectRepo = queryRunner.manager.getRepository(Project);
    const projectMemberRepo = queryRunner.manager.getRepository(ProjectMember);
    const taskRepo = queryRunner.manager.getRepository(Task);

    // 1. Create Demo Workspace
    const workspace = workspaceRepo.create({
      name: 'Demo Workspace',
      slug: `demo-workspace-${user.id.substring(0, 8)}`,
      description: 'Welcome to your demo workspace! Explore all features here.',
      ownerId: user.id,
    });
    await workspaceRepo.save(workspace);

    // 2. Add user as workspace owner
    const workspaceMember = workspaceMemberRepo.create({
      userId: user.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER,
    });
    await workspaceMemberRepo.save(workspaceMember);

    // 3. Create Sample Project
    const project = projectRepo.create({
      name: 'Sample Project',
      description: 'This is a sample project to help you get started. Feel free to explore!',
      workspaceId: workspace.id,
      teamLead: user.id,
      status: ProjectStatus.ACTIVE,
      priority: Priority.MEDIUM,
      progress: 30,
    });
    await projectRepo.save(project);

    // 4. Add user as project manager
    const projectMember = projectMemberRepo.create({
      userId: user.id,
      projectId: project.id,
      role: ProjectRole.MANAGER,
    });
    await projectMemberRepo.save(projectMember);

    // 5. Create sample tasks
    const sampleTasks = [
      {
        title: 'Welcome! Start here',
        description: 'This is your first task. Click on it to see details and try editing it.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        type: TaskType.TASK,
      },
      {
        title: 'Try creating a new task',
        description: 'Click the "Add Task" button to create your own task.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        type: TaskType.FEATURE,
      },
      {
        title: 'Explore the dashboard',
        description: 'Check out the dashboard to see project analytics and progress.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        type: TaskType.TASK,
      },
      {
        title: 'Completed example task',
        description: 'This task is already done. Drag tasks between columns to change status.',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        type: TaskType.TASK,
      },
      {
        title: 'Sample bug to fix',
        description: 'This is an example bug. Try changing its priority or status.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        type: TaskType.BUG,
      },
    ];

    for (const taskData of sampleTasks) {
      const task = taskRepo.create({
        ...taskData,
        projectId: project.id,
        assigneeId: user.id,
      });
      await taskRepo.save(task);
    }
  }
}
