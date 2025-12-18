import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';
import { UserService } from '../service/user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@User() user: CurrentUser) {
    return this.userService.getProfile(user.id);
  }

  @Put('me')
  async updateProfile(
    @User() user: CurrentUser,
    @Body() data: { name?: string; image?: string },
  ) {
    return this.userService.updateProfile(user.id, data);
  }
}
