import { Module } from '@nestjs/common';
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

@Module({
  imports: [PrismaModule, FamilyModule, AuthModule, ConfigModule.forRoot({ isGlobal: true }), ShoppingModule, TaskModule, IdeaPlanModule, RecipeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
