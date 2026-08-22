import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanningTaskDto } from './create-planning-task.dto';

export class UpdatePlanningTaskDto extends PartialType(CreatePlanningTaskDto) {}
