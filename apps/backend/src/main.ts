import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CORS flexible para responder a Vercel o localhost
  app.enableCors({
    origin: true, // Refleja automáticamente el origen de la petición
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;

  // 2. ¡CLAVE!: '0.0.0.0' le dice a NestJS que acepte conexiones externas en Render
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Servidor listo y escuchando en el puerto ${port}`);
}
bootstrap();

