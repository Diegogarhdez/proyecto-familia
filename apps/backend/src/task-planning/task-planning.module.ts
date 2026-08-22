import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TaskPlanningController } from './task-planning.controller';
import { TaskPlanningService } from './task-planning.service';

@Module({
  imports: [AuthModule, PrismaModule, RealtimeModule],
  controllers: [TaskPlanningController],
  providers: [TaskPlanningService],
})
export class TaskPlanningModule {}
