import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FamilyModule } from './family/family.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ShoppingModule } from './shopping/shopping.module';
import { TaskModule } from './tasks/task.module';
import { IdeaPlanModule } from './ideas-plans/idea-plan.module';
import { RecipeModule } from './recipes/recipe.module';
import { ExpenseModule } from './expenses/expense.module';

@Module({
  imports: [
    PrismaModule,
    FamilyModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // Máximo 10 peticiones por segundo
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50, // Máximo 50 peticiones cada 10 segundos
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200, // Máximo 200 peticiones por minuto
      },
    ]),
    ShoppingModule,
    TaskModule,
    IdeaPlanModule,
    RecipeModule,
    ExpenseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
