import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateIdeaPlanDto } from './dto/create-idea-plan.dto';
import { IdeaPlanService } from './idea-plan.service';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@UseGuards(JwtAuthGuard)
@Controller('ideas-plans')
export class IdeaPlanController {
  constructor(private readonly ideaPlanService: IdeaPlanService) {}

  @Post()
  create(@Request() req, @Body() createIdeaPlanDto: CreateIdeaPlanDto) {
    const user = req.user as JwtUserPayload;
    return this.ideaPlanService.create(user.sub, createIdeaPlanDto);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as JwtUserPayload;
    return this.ideaPlanService.findAll(user.sub);
  }

  @Patch(':id/toggle')
  toggleStatus(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.ideaPlanService.toggleStatus(id, user.sub);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.ideaPlanService.remove(id, user.sub);
  }
}
