import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeGateway } from './recipe.gateway';

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeGateway: RecipeGateway,
  ) {}

  private async getUserFamilyId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.familyId;
  }

  private readonly recipeInclude = {
    ingredients: { orderBy: { createdAt: 'asc' as const } },
    steps: { orderBy: { position: 'asc' as const } },
  };

  async create(userId: string, dto: CreateRecipeDto) {
    const familyId = await this.getUserFamilyId(userId);
    const recipe = await this.prisma.recipe.create({
      data: {
        name: dto.name.trim(),
        familyId,
        ingredients: {
          create: dto.ingredients.map((ingredient) => ({
            name: ingredient.name.trim(),
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          })),
        },
        steps: {
          create: dto.steps.map((description, index) => ({
            description: description.trim(),
            position: index,
          })),
        },
      },
      include: this.recipeInclude,
    });

    await this.emitFamilyRecipes(familyId);
    return recipe;
  }

  async findAll(userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    return this.prisma.recipe.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
      include: this.recipeInclude,
    });
  }

  async remove(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    const recipe = await this.prisma.recipe.findFirst({ where: { id, familyId } });
    if (!recipe) throw new NotFoundException('Receta no encontrada');

    const deleted = await this.prisma.recipe.delete({ where: { id } });
    await this.emitFamilyRecipes(familyId);
    return deleted;
  }

  private async emitFamilyRecipes(familyId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
      include: this.recipeInclude,
    });
    this.recipeGateway.emitRecipeListUpdated(familyId, recipes);
  }
}
