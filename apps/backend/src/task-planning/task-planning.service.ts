import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningTaskDto } from './dto/create-planning-task.dto';
import { UpdatePlanningTaskDto } from './dto/update-planning-task.dto';

const taskInclude = {
  preferredUser: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TaskPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async members(userId: string) {
    const user = await this.getUser(userId);
    return this.prisma.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async tasks(userId: string) {
    const user = await this.getUser(userId);
    return this.prisma.task.findMany({
      where: { familyId: user.familyId },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(userId: string, dto: CreatePlanningTaskDto) {
    const user = await this.getUser(userId);
    await this.assertPreferredMember(dto.preferredUserId, user.familyId);
    const task = await this.prisma.task.create({
      data: {
        name: dto.name.trim(),
        timeMinutes: dto.timeMinutes,
        effort: dto.effort,
        weeklyFrequency: dto.weeklyFrequency,
        preferredUserId: dto.preferredUserId || null,
        familyId: user.familyId,
      },
      include: taskInclude,
    });
    await this.emitTasks(user.familyId);
    return task;
  }

  async updateTask(userId: string, id: string, dto: UpdatePlanningTaskDto) {
    const user = await this.getUser(userId);
    const existing = await this.prisma.task.findFirst({ where: { id, familyId: user.familyId } });
    if (!existing) throw new NotFoundException('Tarea no encontrada');
    await this.assertPreferredMember(dto.preferredUserId, user.familyId);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
        ...(dto.timeMinutes === undefined ? {} : { timeMinutes: dto.timeMinutes }),
        ...(dto.effort === undefined ? {} : { effort: dto.effort }),
        ...(dto.weeklyFrequency === undefined ? {} : { weeklyFrequency: dto.weeklyFrequency }),
        ...(dto.preferredUserId === undefined ? {} : { preferredUserId: dto.preferredUserId || null }),
      },
      include: taskInclude,
    });
    await this.emitTasks(user.familyId);
    return task;
  }

  async generate(userId: string, requestedWeekStart?: string) {
    const user = await this.getUser(userId);
    const weekStart = this.normalizeWeekStart(requestedWeekStart);
    const [members, tasks] = await Promise.all([
      this.prisma.user.findMany({ where: { familyId: user.familyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.task.findMany({ where: { familyId: user.familyId }, include: taskInclude }),
    ]);
    if (members.length === 0) throw new BadRequestException('La familia no tiene miembros');

    const memberIds = new Set(members.map((member) => member.id));
    const loads = new Map(members.map((member) => [member.id, 0]));
    const weighted = tasks.map((task) => ({ task, weight: this.weight(task) }));
    const assignments: Array<{ taskId: string; assignedUserId: string; weight: number; wasPreferred: boolean }> = [];

    // Fase 1: las preferencias se respetan y forman la carga inicial.
    const neutral: typeof weighted = [];
    for (const item of weighted) {
      if (item.task.preferredUserId && memberIds.has(item.task.preferredUserId)) {
        assignments.push({ taskId: item.task.id, assignedUserId: item.task.preferredUserId, weight: item.weight, wasPreferred: true });
        loads.set(item.task.preferredUserId, (loads.get(item.task.preferredUserId) ?? 0) + item.weight);
      } else {
        neutral.push(item);
      }
    }

    // Fase 2: primero las tareas más pesadas; los empates se rotan al azar.
    neutral.sort((a, b) => b.weight - a.weight);
    for (const item of neutral) {
      const minimum = Math.min(...loads.values());
      const candidates = members.filter((member) => Math.abs((loads.get(member.id) ?? 0) - minimum) < 0.000001);
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      assignments.push({ taskId: item.task.id, assignedUserId: selected.id, weight: item.weight, wasPreferred: false });
      loads.set(selected.id, (loads.get(selected.id) ?? 0) + item.weight);
    }

    const plan = await this.prisma.$transaction(async (tx) => {
      const savedPlan = await tx.taskPlan.upsert({
        where: { familyId_weekStart: { familyId: user.familyId, weekStart } },
        update: {},
        create: { familyId: user.familyId, weekStart },
      });
      await tx.taskAssignment.deleteMany({ where: { planId: savedPlan.id } });
      await tx.taskAssignment.createMany({ data: assignments.map((assignment) => ({ ...assignment, planId: savedPlan.id })) });
      return savedPlan;
    });

    const result = await this.planById(plan.id);
    this.realtimeGateway.emitTaskPlanUpdated(user.familyId, result);
    return result;
  }

  async plan(userId: string, requestedWeekStart?: string) {
    const user = await this.getUser(userId);
    const weekStart = this.normalizeWeekStart(requestedWeekStart);
    const savedPlan = await this.prisma.taskPlan.findUnique({ where: { familyId_weekStart: { familyId: user.familyId, weekStart } } });
    return savedPlan ? this.planById(savedPlan.id) : null;
  }

  private async planById(id: string) {
    return this.prisma.taskPlan.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            task: { include: taskInclude },
            assignedUser: { select: { id: true, name: true } },
          },
          orderBy: { weight: 'desc' },
        },
      },
    });
  }

  private weight(task: Pick<Task, 'timeMinutes' | 'effort' | 'weeklyFrequency'>) {
    return task.timeMinutes * task.effort * task.weeklyFrequency;
  }

  private async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, familyId: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private async assertPreferredMember(preferredUserId: string | null | undefined, familyId: string) {
    if (!preferredUserId) return;
    const member = await this.prisma.user.findFirst({ where: { id: preferredUserId, familyId }, select: { id: true } });
    if (!member) throw new BadRequestException('El usuario preferido no pertenece a la familia');
  }

  private async emitTasks(familyId: string) {
    const tasks = await this.prisma.task.findMany({ where: { familyId }, include: taskInclude, orderBy: { createdAt: 'desc' } });
    this.realtimeGateway.emitTasksListUpdated(familyId, tasks);
  }

  private normalizeWeekStart(input?: string) {
    const date = input ? new Date(`${input}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('weekStart debe tener formato YYYY-MM-DD');
    const day = date.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + mondayOffset);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
}
