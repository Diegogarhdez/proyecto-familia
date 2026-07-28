import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) 
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Get('me')
  getProfile(@Req() req: Request) {
    // Al pasar por el Guard, se inyectó req.user
    return {
      message: '¡Bienvenido a la ruta protegida!',
      usuarioAutenticado: req['user'], 
    };
  }
}
