import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JoinDto } from './dto/join.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('join')
  async joinFamily(@Body() joinDto: JoinDto) {
    return this.authService.joinFamily(joinDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) 
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Get('me')
  getProfile(@Req() req: Request) {
    const user = req['user'] as JwtUserPayload;
    return this.authService.getProfile(user.sub);
  }
}
