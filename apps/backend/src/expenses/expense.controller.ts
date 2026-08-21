import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExpenseCategoryDto, CreateExpenseDto, MonthDto, UpsertIncomeDto } from './dto/expense.dto';
import { ExpenseService } from './expense.service';

type JwtUserPayload = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('dashboard')
  dashboard(@Request() req, @Query() query: MonthDto) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.dashboard(user.sub, query.month);
  }

  @Patch('income')
  upsertIncome(@Request() req, @Body() dto: UpsertIncomeDto) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.upsertIncome(user.sub, dto);
  }

  @Delete('income/:month')
  removeIncome(@Request() req, @Param('month') month: string) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.removeIncome(user.sub, month);
  }

  @Post('categories')
  createCategory(@Request() req, @Body() dto: CreateExpenseCategoryDto) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.createCategory(user.sub, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Request() req, @Param('id') id: string) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.removeCategory(user.sub, id);
  }

  @Post()
  createExpense(@Request() req, @Body() dto: CreateExpenseDto) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.createExpense(user.sub, dto);
  }

  @Delete(':id')
  removeExpense(@Request() req, @Param('id') id: string, @Query() query: MonthDto) {
    const user = req.user as JwtUserPayload;
    return this.expenseService.removeExpense(user.sub, id, query.month);
  }
}
