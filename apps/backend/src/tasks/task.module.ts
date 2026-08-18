import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskController } from './task.controller';
import { TaskGateway } from './task.gateway';
import { TaskService } from './task.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
})
export class TaskModule {}
