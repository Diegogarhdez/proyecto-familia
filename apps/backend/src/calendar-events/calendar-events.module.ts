import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarEventsController } from './calendar-events.controller';
import { CalendarEventsGateway } from './calendar-events.gateway';
import { CalendarEventsService } from './calendar-events.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalendarEventsController],
  providers: [CalendarEventsService, CalendarEventsGateway],
})
export class CalendarEventsModule {}
