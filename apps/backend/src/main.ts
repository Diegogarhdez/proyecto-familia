import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔴 ARRAY EXPLÍCITO DE ORIGENES PERMITIDOS
  app.enableCors({
    origin: [
      'https://proyecto-familia-five.vercel.app', // Tu frontend en producción
      'http://localhost:5173',                    // Tu frontend local
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();

