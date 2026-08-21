import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpenseController } from './expense.controller';
import { ExpenseGateway } from './expense.gateway';
import { ExpenseService } from './expense.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, ExpenseGateway],
})
export class ExpenseModule {}
