import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Si lo tenías de antes

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',                     // Tu entorno local
      'https://proyecto-familia-five.vercel.app', // Tu frontend en Vercel
      process.env.FRONTEND_URL,                    // Por si añades la variable en Render
    ].filter(Boolean) as string[],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });


  app.setGlobalPrefix('api'); 
  
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();