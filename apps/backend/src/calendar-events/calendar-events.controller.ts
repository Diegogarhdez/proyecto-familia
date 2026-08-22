import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventsService } from './calendar-events.service';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@UseGuards(JwtAuthGuard)
@Controller('calendar-events')
export class CalendarEventsController {
  constructor(private readonly calendarEventsService: CalendarEventsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateCalendarEventDto) {
    const user = req.user as JwtUserPayload;
    return this.calendarEventsService.create(user.sub, dto);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as JwtUserPayload;
    return this.calendarEventsService.findAll(user.sub);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    const user = req.user as JwtUserPayload;
    return this.calendarEventsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.calendarEventsService.remove(id, user.sub);
  }
}
