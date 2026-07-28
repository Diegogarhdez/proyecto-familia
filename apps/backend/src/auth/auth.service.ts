import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'; // 👈 Importar JwtService
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // 👈 Importar el nuevo DTO
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService // 👈 Inyectarlo aquí
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        familyId: dto.familyId,
        passwordHash: hashedPassword,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }

}
