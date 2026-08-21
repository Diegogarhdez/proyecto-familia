import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JoinDto } from './dto/join.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerificationEmailDto } from './dto/verification-email.dto';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 registros por minuto por IP
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 peticiones de unirse por minuto
  @Post('join')
  async joinFamily(@Body() joinDto: JoinDto) {
    return this.authService.joinFamily(joinDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 intentos de login por minuto (anti fuerza bruta)
  @Post('login')
  @HttpCode(HttpStatus.OK) 
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 intentos de verificación por minuto
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Máximo 3 envíos de correo por minuto
  @Post('verification-code')
  async sendVerificationCode(@Body() body: VerificationEmailDto) {
    return this.authService.sendVerificationCode(body.email);
  }

  @UseGuards(JwtAuthGuard) 
  @Get('me')
  getProfile(@Req() req: Request) {
    const user = req['user'] as JwtUserPayload;
    return this.authService.getProfile(user.sub);
  }
}
