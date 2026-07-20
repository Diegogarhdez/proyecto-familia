import { Controller, Post, Body } from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';

@Controller('api/families') // Esto define la URL base del controlador
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  async createFamily(@Body() createFamilyDto: CreateFamilyDto) {
    return this.familyService.createFamily(createFamilyDto);
  }
}