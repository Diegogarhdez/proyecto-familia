import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto, CreateExpenseDto, UpsertIncomeDto } from './dto/expense.dto';
import { ExpenseGateway } from './expense.gateway';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expenseGateway: ExpenseGateway,
  ) {}

  private async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private async getDashboard(familyId: string, userId: string, month: string) {
    const [family, incomes, categories, expenses] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId }, include: { users: true } }),
      this.prisma.monthlyIncome.findMany({
        where: { familyId, month },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
      this.prisma.expenseCategory.findMany({ where: { familyId }, orderBy: { name: 'asc' } }),
      this.prisma.expense.findMany({
        where: { familyId, month },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!family) throw new NotFoundException('Familia no encontrada');

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = new Map<string, number>();
    expenses.forEach((expense) => {
      if (expense.categoryId) {
        categoryTotals.set(expense.categoryId, (categoryTotals.get(expense.categoryId) ?? 0) + expense.amount);
      }
    });

    return {
      month,
      myIncome: incomes.find((income) => income.userId === userId)?.amount ?? 0,
      totalIncome,
      totalSpent,
      available: totalIncome - totalSpent,
      contributions: incomes,
      categories: categories.map((category) => ({
        ...category,
        spent: categoryTotals.get(category.id) ?? 0,
        percentage: category.monthlyLimit > 0
          ? Math.round(((categoryTotals.get(category.id) ?? 0) / category.monthlyLimit) * 100)
          : 0,
      })),
      expenses,
    };
  }

  private async dashboardForUser(userId: string, month: string) {
    return this.getDashboard((await this.getUser(userId)).familyId, userId, month);
  }

  async dashboard(userId: string, month: string) {
    return this.dashboardForUser(userId, month);
  }

  async upsertIncome(userId: string, dto: UpsertIncomeDto) {
    const user = await this.getUser(userId);
    await this.prisma.monthlyIncome.upsert({
      where: { userId_month: { userId, month: dto.month } },
      update: { amount: { increment: dto.amount } },
      create: { userId, familyId: user.familyId, month: dto.month, amount: dto.amount },
    });
    return this.broadcast(userId, dto.month);
  }

  async removeIncome(userId: string, month: string) {
    const user = await this.getUser(userId);
    const income = await this.prisma.monthlyIncome.findUnique({ where: { userId_month: { userId, month } } });
    if (!income || income.familyId !== user.familyId) throw new NotFoundException('Aportación no encontrada');
    await this.prisma.monthlyIncome.delete({ where: { userId_month: { userId, month } } });
    return this.broadcast(userId, month);
  }

  async createCategory(userId: string, dto: CreateExpenseCategoryDto) {
    const user = await this.getUser(userId);
    await this.prisma.expenseCategory.create({
      data: { familyId: user.familyId, name: dto.name.trim(), emoji: dto.emoji.trim(), monthlyLimit: dto.monthlyLimit },
    });
    return this.broadcast(userId, this.currentMonth());
  }

  async createExpense(userId: string, dto: CreateExpenseDto) {
    const user = await this.getUser(userId);
    if (dto.categoryId) {
      const category = await this.prisma.expenseCategory.findFirst({ where: { id: dto.categoryId, familyId: user.familyId } });
      if (!category) throw new NotFoundException('Categoría no encontrada');
    }
    await this.prisma.expense.create({
      data: {
        familyId: user.familyId,
        month: dto.month,
        name: dto.name.trim(),
        emoji: dto.emoji.trim(),
        amount: dto.amount,
        categoryId: dto.categoryId,
      },
    });
    return this.broadcast(userId, dto.month);
  }

  async removeExpense(userId: string, id: string, month: string) {
    const user = await this.getUser(userId);
    const expense = await this.prisma.expense.findFirst({ where: { id, familyId: user.familyId } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    await this.prisma.expense.delete({ where: { id } });
    return this.broadcast(userId, month);
  }

  async removeCategory(userId: string, id: string) {
    const user = await this.getUser(userId);
    const category = await this.prisma.expenseCategory.findFirst({ where: { id, familyId: user.familyId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.prisma.expenseCategory.delete({ where: { id } });
    return this.broadcast(userId, this.currentMonth());
  }

  private currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  private async broadcast(userId: string, month: string) {
    const user = await this.getUser(userId);
    const dashboard = await this.dashboardForUser(userId, month);
    this.expenseGateway.emitExpensesUpdated(user.familyId, dashboard);
    return dashboard;
  }
}
