import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Si lo tenías de antes

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔴 CORS A PRUEBA DE FALLOS
  app.enableCors({
    origin: (origin, callback) => {
      // Lista de orígenes permitidos
      const allowedOrigins = [
        'http://localhost:5173',
        'https://proyecto-familia-five.vercel.app',
      ];

      // Si no hay origin (ej. llamadas de Postman/móvil) o el origen está en la lista permitida
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // O cambiar por callback(new Error('CORS no permitido'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}

bootstrap();

