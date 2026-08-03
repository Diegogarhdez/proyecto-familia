import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ShoppingService } from './shopping.service';
import { CreateShoppingDto } from './dto/create-shopping.dto';
import { UpdateShoppingDto } from './dto/update-shopping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajusta la ruta si es necesario

type JwtUserPayload = {
  sub: string;
  email: string;
};

@UseGuards(JwtAuthGuard) // 👈 Todo el controlador está protegido
@Controller('shopping')
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Post()
  create(@Request() req, @Body() createShoppingDto: CreateShoppingDto) {
    const user = req.user as JwtUserPayload;
    return this.shoppingService.create(user.sub, createShoppingDto);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as JwtUserPayload;
    return this.shoppingService.findAll(user.sub);
  }

  @Patch(':id/quantity')
  updateQuantity(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateShoppingDto,
  ) {
    const user = req.user as JwtUserPayload;
    return this.shoppingService.updateQuantity(id, user.sub, body.quantity);
  }

  @Patch(':id/toggle')
  toggleStatus(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.shoppingService.toggleStatus(id, user.sub);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.shoppingService.remove(id, user.sub);
  }
}
