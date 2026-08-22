import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RecipeController } from './recipe.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { RecipeService } from './recipe.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
