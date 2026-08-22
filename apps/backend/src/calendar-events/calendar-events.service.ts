import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CalendarEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private readonly eventInclude = {
    creator: {
      select: {
        id: true,
        name: true,
      },
    },
  } satisfies Prisma.CalendarEventInclude;

  private async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private async getUserFamilyId(userId: string) {
    return (await this.getUser(userId)).familyId;
  }

  private async getFamilyEventOrFail(id: string, familyId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, familyId },
    });

    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  private validateRange(startAt: Date, endAt: Date) {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Las fechas del evento no son válidas');
    }

    if (endAt.getTime() <= startAt.getTime()) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }
  }

  async create(userId: string, dto: CreateCalendarEventDto) {
    const familyId = await this.getUserFamilyId(userId);
    this.validateRange(dto.startAt, dto.endAt);

    const event = await this.prisma.calendarEvent.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startAt: dto.startAt,
        endAt: dto.endAt,
        isAllDay: dto.isAllDay ?? false,
        color: dto.color ?? '#3b82f6',
        category: dto.category?.trim() || null,
        familyId,
        creatorId: userId,
      },
      include: this.eventInclude,
    });

    await this.emitFamilyCalendarEvents(familyId);
    return event;
  }

  async findAll(userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    return this.prisma.calendarEvent.findMany({
      where: { familyId },
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
      include: this.eventInclude,
    });
  }

  async update(id: string, userId: string, dto: UpdateCalendarEventDto) {
    const familyId = await this.getUserFamilyId(userId);
    await this.getFamilyEventOrFail(id, familyId);

    if (dto.startAt && !dto.endAt) {
      throw new BadRequestException('La fecha de fin es obligatoria al editar el inicio del evento');
    }

    if (!dto.startAt && dto.endAt) {
      throw new BadRequestException('La fecha de inicio es obligatoria al editar el fin del evento');
    }

    if (dto.startAt && dto.endAt) {
      this.validateRange(dto.startAt, dto.endAt);
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description === undefined ? undefined : dto.description?.trim() || null,
        startAt: dto.startAt,
        endAt: dto.endAt,
        isAllDay: dto.isAllDay,
        color: dto.color,
        category: dto.category === undefined ? undefined : dto.category?.trim() || null,
      },
      include: this.eventInclude,
    });

    await this.emitFamilyCalendarEvents(familyId);
    return updatedEvent;
  }

  async remove(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    await this.getFamilyEventOrFail(id, familyId);

    const deleted = await this.prisma.calendarEvent.delete({ where: { id } });
    await this.emitFamilyCalendarEvents(familyId);
    return deleted;
  }

  private async emitFamilyCalendarEvents(familyId: string) {
    const events = await this.prisma.calendarEvent.findMany({
      where: { familyId },
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
      include: this.eventInclude,
    });

    this.realtimeGateway.emitCalendarEventsUpdated(familyId, events);
  }
}
