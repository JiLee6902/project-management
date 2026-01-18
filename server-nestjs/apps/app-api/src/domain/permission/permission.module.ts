import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Permission,
  Role,
  WorkspaceMember,
  ProjectMember,
  Task,
  Project,
  Comment,
  Workspace,
} from '@app/entity/entities';
import { PermissionController } from './controller/permission.controller';
import { PermissionService } from './service/permission.service';
import { PolicyService } from './service/policy.service';
import { RoleService } from './service/role.service';
import { PermissionSeedService } from './service/permission-seed.service';
import { PERMISSION_SERVICE } from '@app/shared-libs/guards/permissions.guard';
import { POLICY_SERVICE } from '@app/shared-libs/guards/policy.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      WorkspaceMember,
      ProjectMember,
      Task,
      Project,
      Comment,
      Workspace,
    ]),
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PolicyService,
    RoleService,
    PermissionSeedService,
    // Provide services for guards
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionService,
    },
    {
      provide: POLICY_SERVICE,
      useClass: PolicyService,
    },
  ],
  exports: [
    PermissionService,
    PolicyService,
    RoleService,
    PERMISSION_SERVICE,
    POLICY_SERVICE,
  ],
})
export class PermissionModule {}
