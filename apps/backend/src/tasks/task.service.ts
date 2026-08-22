import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async getUserFamilyId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.familyId;
  }

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const familyId = await this.getUserFamilyId(userId);
    const task = await this.prisma.task.create({
      data: {
        name: createTaskDto.name.trim(),
        familyId,
      },
    });

    await this.emitFamilyTaskList(familyId);
    return task;
  }

  async findAll(userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    return this.prisma.task.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleStatus(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);

    const task = await this.prisma.task.findFirst({
      where: { id, familyId },
    });

    if (!task) throw new NotFoundException('Tarea no encontrada');

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { isDone: !task.isDone },
    });

    await this.emitFamilyTaskList(familyId);
    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);

    const task = await this.prisma.task.findFirst({
      where: { id, familyId },
    });

    if (!task) throw new NotFoundException('Tarea no encontrada');

    const deleted = await this.prisma.task.delete({ where: { id } });
    await this.emitFamilyTaskList(familyId);
    return deleted;
  }

  private async emitFamilyTaskList(familyId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    this.realtimeGateway.emitTasksListUpdated(familyId, tasks);
  }
}
