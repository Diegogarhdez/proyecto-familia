import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskService } from './task.service';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    const user = req.user as JwtUserPayload;
    return this.taskService.create(user.sub, createTaskDto);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as JwtUserPayload;
    return this.taskService.findAll(user.sub);
  }

  @Patch(':id/toggle')
  toggleStatus(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.taskService.toggleStatus(id, user.sub);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.taskService.remove(id, user.sub);
  }
}
