import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async createFamily(dto: CreateFamilyDto) {
    // Prisma nos da el autocompletado exacto basado en el schema.prisma
    return this.prisma.family.create({
      data: {
        name: dto.name,
      },
    });
  }
}