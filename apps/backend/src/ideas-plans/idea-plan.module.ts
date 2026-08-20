import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IdeaPlanController } from './idea-plan.controller';
import { IdeaPlanGateway } from './idea-plan.gateway';
import { IdeaPlanService } from './idea-plan.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IdeaPlanController],
  providers: [IdeaPlanService, IdeaPlanGateway],
})
export class IdeaPlanModule {}
