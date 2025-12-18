import { Controller, Post, HttpCode, HttpStatus, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { User, CurrentUser } from '@app/shared-libs';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthPrivateController {
  constructor(private readonly authService: AuthService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @User() user: CurrentUser,
    @Headers('authorization') authHeader: string,
  ): Promise<{ message: string }> {
    const token = authHeader?.replace('Bearer ', '');
    await this.authService.logout(user.id, token);
    return { message: 'Logged out successfully' };
  }
}
