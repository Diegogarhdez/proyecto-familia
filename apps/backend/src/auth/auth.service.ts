import {
  Injectable,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt'; // 👈 Importar JwtService
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // 👈 Importar el nuevo DTO
import { JoinDto } from './dto/join.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import nodemailer from 'nodemailer';

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
    if (dto.password !== dto.confirmPassword) {
      throw new ConflictException('Las contraseñas no coinciden');
    }

    const email = this.normalizeEmail(dto.email);

    // Verificamos si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Encriptamos la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const inviteCode = await this.getUniqueInviteCode();
    const verificationCode = this.generateVerificationCode();

    // Creamos la Familia y el Usuario en una sola transacción
    try {
      const newUser = await this.prisma.user.create({
        include: {
          family: true,
        },
        data: {
          name: dto.name,
          email,
          passwordHash,
          emailVerified: false,
          verificationCodeHash: this.hashVerificationCode(verificationCode),
          verificationCodeExpiresAt: this.verificationCodeExpiry(),
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
      const { passwordHash: _, verificationCodeHash: __, verificationCodeExpiresAt: ___, ...userWithoutPassword } = newUser;
      try {
        await this.sendVerificationEmail(email, verificationCode);
      } catch (error) {
        console.error('Error enviando verificación por SMTP:', error);
        await this.prisma.user.delete({ where: { id: newUser.id } });
        await this.prisma.family.delete({ where: { id: newUser.family.id } });
        throw new ServiceUnavailableException('No se pudo enviar el código de verificación');
      }
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
  }

  async joinFamily(dto: JoinDto) {
    const email = this.normalizeEmail(dto.email);
    const family = await this.prisma.family.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!family) {
      throw new NotFoundException('El código de invitación no es válido');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          name: dto.name,
          email,
          passwordHash,
          role: 'MEMBER',
          familyId: family.id,
        },
      });

      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Debes verificar tu correo antes de iniciar sesión');
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

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      throw new ConflictException('Este correo ya está verificado o no existe');
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt.getTime() < Date.now() ||
      this.hashVerificationCode(dto.code) !== user.verificationCodeHash
    ) {
      throw new UnauthorizedException('El código no es válido o ha caducado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
      },
    });

    return { message: 'Correo verificado correctamente' };
  }

  async sendVerificationCode(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      throw new ConflictException('Este correo ya está verificado o no existe');
    }

    const code = this.generateVerificationCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCodeHash: this.hashVerificationCode(code),
        verificationCodeExpiresAt: this.verificationCodeExpiry(),
      },
    });
    await this.sendVerificationEmail(email, code);
    return { message: 'Código de verificación enviado' };
  }

  private generateVerificationCode() {
    return randomInt(100000, 1000000).toString();
  }

  private hashVerificationCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private verificationCodeExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private async sendVerificationEmail(email: string, code: string) {
    const host = this.cleanEnvironmentValue(process.env.SMTP_HOST);
    const port = Number(this.cleanEnvironmentValue(process.env.SMTP_PORT) ?? 587);
    const user = this.cleanEnvironmentValue(process.env.SMTP_USER);
    const password = this.cleanEnvironmentValue(process.env.SMTP_PASS);
    const from = this.cleanEnvironmentValue(process.env.SMTP_FROM);
    if (!host || !user || !password || !from || !Number.isInteger(port)) {
      throw new Error('Faltan SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS o SMTP_FROM');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Tu código de verificación de Kinly',
      html: `<p>Tu código de verificación es:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 8px">${code}</p><p>Caduca en 10 minutos.</p>`,
    });
  }

  private cleanEnvironmentValue(value?: string) {
    return value?.trim().replace(/^['"]|['"]$/g, '');
  }

}
