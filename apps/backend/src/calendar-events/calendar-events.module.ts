import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarEventsController } from './calendar-events.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { CalendarEventsService } from './calendar-events.service';

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [CalendarEventsController],
  providers: [CalendarEventsService],
})
export class CalendarEventsModule {}
