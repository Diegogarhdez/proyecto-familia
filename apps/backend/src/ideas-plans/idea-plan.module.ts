import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IdeaPlanController } from './idea-plan.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { IdeaPlanService } from './idea-plan.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [IdeaPlanController],
  providers: [IdeaPlanService],
})
export class IdeaPlanModule {}
