import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'; // 👈 Importar JwtService
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // 👈 Importar el nuevo DTO
import { JoinDto } from './dto/join.dto';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService // 👈 Inyectarlo aquí
  ) {}

  private generateInviteCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i += 1) {
      code += chars[randomInt(chars.length)];
    }

    return code;
  }

  async register(dto: RegisterDto) {
    // Verificamos si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Encriptamos la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const inviteCode = await this.getUniqueInviteCode();

    // Creamos la Familia y el Usuario en una sola transacción
    const newUser = await this.prisma.user.create({
      include: {
        family: true,
      },
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'ADMIN', // El creador de la familia será el Admin
        family: {
          create: {
            name: dto.familyName, // Prisma crea la familia y vincula el ID automáticamente
            inviteCode,
          },
        },
      },
    });

    // Devolvemos el usuario sin la contraseña y con la familia creada
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async joinFamily(dto: JoinDto) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!family) {
      throw new NotFoundException('El código de invitación no es válido');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'MEMBER',
        familyId: family.id,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        family: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      familyCode: user.role === 'ADMIN' ? user.family.inviteCode : null,
    };
  }

  private async getUniqueInviteCode() {
    let inviteCode = this.generateInviteCode();
    let family = await this.prisma.family.findUnique({
      where: { inviteCode },
    });

    while (family) {
      inviteCode = this.generateInviteCode();
      family = await this.prisma.family.findUnique({
        where: { inviteCode },
      });
    }

    return inviteCode;
  }

}
