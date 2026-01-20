import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LoginResponseDto, GuestLoginDto } from '../dto';
import { Public } from '../decorator/public.decorator';

@Controller('auth')
export class AuthPublicController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Public()
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async guestLogin(
    @Body() guestLoginDto: GuestLoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    return this.authService.guestLogin(ipAddress, guestLoginDto.deviceFingerprint);
  }
}
