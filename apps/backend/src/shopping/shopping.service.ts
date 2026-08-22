import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajusta la ruta a tu PrismaService
import { CreateShoppingDto } from './dto/create-shopping.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ShoppingService {
  constructor(
    private prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Función auxiliar para obtener la familia del usuario logueado
  private async getUserFamilyId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.familyId;
  }

  // 1. Crear un producto
  async create(userId: string, createShoppingDto: CreateShoppingDto) {
    const familyId = await this.getUserFamilyId(userId);
    const item = await this.prisma.shoppingItem.create({
      data: {
        name: createShoppingDto.name,
        quantity: createShoppingDto.quantity ?? 1,
        familyId,
      },
    });

    await this.emitFamilyShoppingList(familyId);
    return item;
  }

  // 2. Leer todos los productos de la familia
  async findAll(userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    return this.prisma.shoppingItem.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' }, // Los más nuevos primero
    });
  }

  async updateQuantity(id: string, userId: string, quantity: number) {
    const familyId = await this.getUserFamilyId(userId);

    const existingItem = await this.prisma.shoppingItem.findFirst({
      where: { id, familyId },
    });

    if (!existingItem) throw new NotFoundException('Producto no encontrado');

    const updatedItem = await this.prisma.shoppingItem.update({
      where: { id },
      data: { quantity },
    });

    await this.emitFamilyShoppingList(familyId);
    return updatedItem;
  }

  // 3. Cambiar el estado (Comprado / No comprado)
  async toggleStatus(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    
    // Primero buscamos el item para asegurarnos de que pertenece a su familia
    const item = await this.prisma.shoppingItem.findFirst({
      where: { id, familyId },
    });

    if (!item) throw new NotFoundException('Producto no encontrado');

    // Lo actualizamos invirtiendo su estado actual (!item.isBought)
    const updatedItem = await this.prisma.shoppingItem.update({
      where: { id },
      data: { isBought: !item.isBought },
    });

    await this.emitFamilyShoppingList(familyId);
    return updatedItem;
  }

  // 4. Borrar un producto (ej. si nos equivocamos al escribir)
  async remove(id: string, userId: string) {
    const familyId = await this.getUserFamilyId(userId);
    
    // Verificamos que sea de su familia antes de borrar
    const item = await this.prisma.shoppingItem.findFirst({
      where: { id, familyId },
    });

    if (!item) throw new NotFoundException('Producto no encontrado');

    const deleted = await this.prisma.shoppingItem.delete({ where: { id } });
    await this.emitFamilyShoppingList(familyId);
    return deleted;
  }

  private async emitFamilyShoppingList(familyId: string) {
    const items = await this.prisma.shoppingItem.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    this.realtimeGateway.emitShoppingListUpdated(familyId, items);
  }
}
