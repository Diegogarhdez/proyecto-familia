import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskController } from './task.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { TaskService } from './task.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
