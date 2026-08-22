import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePlanningTaskDto } from './dto/create-planning-task.dto';
import { UpdatePlanningTaskDto } from './dto/update-planning-task.dto';
import { TaskPlanningService } from './task-planning.service';

@UseGuards(JwtAuthGuard)
@Controller('task-planning')
export class TaskPlanningController {
  constructor(private readonly service: TaskPlanningService) {}

  @Get('members')
  members(@Request() req: { user: { sub: string } }) {
    return this.service.members(req.user.sub);
  }

  @Get('tasks')
  tasks(@Request() req: { user: { sub: string } }) {
    return this.service.tasks(req.user.sub);
  }

  @Post('tasks')
  createTask(@Request() req: { user: { sub: string } }, @Body() dto: CreatePlanningTaskDto) {
    return this.service.createTask(req.user.sub, dto);
  }

  @Patch('tasks/:id')
  updateTask(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePlanningTaskDto,
  ) {
    return this.service.updateTask(req.user.sub, id, dto);
  }

  @Post('generate')
  generate(@Request() req: { user: { sub: string } }, @Body() body: { weekStart?: string }) {
    return this.service.generate(req.user.sub, body?.weekStart);
  }

  @Get('plans')
  plan(@Request() req: { user: { sub: string } }, @Query('weekStart') weekStart?: string) {
    return this.service.plan(req.user.sub, weekStart);
  }
}
