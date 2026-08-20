import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeService } from './recipe.service';

type JwtUserPayload = {
  sub: string;
  email: string;
};

@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateRecipeDto) {
    const user = req.user as JwtUserPayload;
    return this.recipeService.create(user.sub, dto);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as JwtUserPayload;
    return this.recipeService.findAll(user.sub);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.recipeService.remove(id, user.sub);
  }
}
