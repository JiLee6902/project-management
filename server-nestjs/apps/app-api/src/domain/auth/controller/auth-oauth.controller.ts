import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthProvider } from '@app/entity/entities';
import { AuthService, OAuthUserData } from '../service/auth.service';
import { Public } from '../decorator/public.decorator';
import { GoogleAuthGuard } from '../guard/google-auth.guard';
import { GithubAuthGuard } from '../guard/github-auth.guard';

@Controller('auth')
export class AuthOAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // Google OAuth
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const userData = req.user as OAuthUserData;
    const result = await this.authService.oauthLogin(userData, AuthProvider.GOOGLE);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const callbackUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&userId=${result.user.id}&email=${encodeURIComponent(result.user.email)}&name=${encodeURIComponent(result.user.name || '')}`;

    return res.redirect(callbackUrl);
  }

  // GitHub OAuth
  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const userData = req.user as OAuthUserData;
    const result = await this.authService.oauthLogin(userData, AuthProvider.GITHUB);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const callbackUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&userId=${result.user.id}&email=${encodeURIComponent(result.user.email)}&name=${encodeURIComponent(result.user.name || '')}`;

    return res.redirect(callbackUrl);
  }
}
