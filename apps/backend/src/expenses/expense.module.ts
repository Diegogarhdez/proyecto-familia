import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpenseController } from './expense.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { ExpenseService } from './expense.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
