import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, IAuthResponse } from '@workspace/data';
import { Public, CurrentUser } from '@workspace/auth';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<IAuthResponse> {
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<IAuthResponse> {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.validateUser(user.userId);
  }
}