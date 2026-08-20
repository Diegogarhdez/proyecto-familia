import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RecipeController } from './recipe.controller';
import { RecipeGateway } from './recipe.gateway';
import { RecipeService } from './recipe.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecipeController],
  providers: [RecipeService, RecipeGateway],
})
export class RecipeModule {}
