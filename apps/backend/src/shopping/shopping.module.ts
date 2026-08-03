import { Module } from '@nestjs/common';
import { ShoppingService } from './shopping.service';
import { ShoppingController } from './shopping.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ShoppingGateway } from './shopping.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ShoppingController],
  providers: [ShoppingService, ShoppingGateway],
})
export class ShoppingModule {}
