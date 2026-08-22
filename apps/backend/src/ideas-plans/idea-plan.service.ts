import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdeaPlanDto } from './dto/create-idea-plan.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class IdeaPlanService {
  constructor(
    private prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async getUserFamilyId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.familyId;
  }

  async create(userId: string, createIdeaPlanDto: CreateIdeaPlanDto) {
    const familyId = await this.getUserFamilyId(userId);
    const ideaPlan = await this.prisma.ideaPlan.create({
      data: {
        name: createIdeaPlanDto.name.trim(),
        familyId,
      },
    });

    await this.emitFamilyIdeaPlanList(familyId);
    return ideaPlan;
  }

  async findAll(userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    return this.prisma.ideaPlan.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleStatus(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    const ideaPlan = await this.prisma.ideaPlan.findFirst({
      where: { id, familyId },
    });

    if (!ideaPlan) throw new NotFoundException('Idea o plan no encontrado');

    const updatedIdeaPlan = await this.prisma.ideaPlan.update({
      where: { id },
      data: { isDone: !ideaPlan.isDone },
    });

    await this.emitFamilyIdeaPlanList(familyId);
    return updatedIdeaPlan;
  }

  async remove(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    const ideaPlan = await this.prisma.ideaPlan.findFirst({
      where: { id, familyId },
    });

    if (!ideaPlan) throw new NotFoundException('Idea o plan no encontrado');

    const deleted = await this.prisma.ideaPlan.delete({ where: { id } });
    await this.emitFamilyIdeaPlanList(familyId);
    return deleted;
  }

  private async emitFamilyIdeaPlanList(familyId: string) {
    const ideasPlans = await this.prisma.ideaPlan.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    this.realtimeGateway.emitIdeasPlansListUpdated(familyId, ideasPlans);
  }
}
