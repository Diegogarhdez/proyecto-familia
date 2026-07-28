import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No se envió ningún token de acceso');
    }
    
    try {
      // Verificamos el token con la MISMA palabra secreta que usamos al firmarlo
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET') // Leemos del .env
      });
      
      // Magia: Pegamos los datos descifrados del usuario al objeto "request"
      // Así estarán disponibles en nuestro controlador
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    
    return true;
  }

  // Extrae el token del formato "Bearer eyJhbGci..."
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}