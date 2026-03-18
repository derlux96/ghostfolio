import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';

import { Injectable } from '@nestjs/common';

import { CreateSavingsPlanDto, UpdateSavingsPlanDto } from './savings-plan.dto';

@Injectable()
export class SavingsPlanService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSavingsPlans(userId: string) {
    return this.prismaService.savingsPlan.findMany({
      where: { userId },
      include: { account: { select: { id: true, name: true } } },
      orderBy: [{ isActive: 'desc' }, { category: 'asc' }, { name: 'asc' }]
    });
  }

  async getSavingsPlan(id: string, userId: string) {
    return this.prismaService.savingsPlan.findFirst({
      where: { id, userId },
      include: { account: { select: { id: true, name: true } } }
    });
  }

  async createSavingsPlan(userId: string, dto: CreateSavingsPlanDto) {
    return this.prismaService.savingsPlan.create({
      data: {
        name: dto.name,
        isin: dto.isin,
        amount: dto.amount,
        interval: dto.interval,
        dayOfMonth: dto.dayOfMonth,
        category: dto.category,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        accountId: dto.accountId,
        accountUserId: dto.accountId ? userId : undefined,
        userId
      },
      include: { account: { select: { id: true, name: true } } }
    });
  }

  async updateSavingsPlan(
    id: string,
    userId: string,
    dto: UpdateSavingsPlanDto
  ) {
    const existing = await this.prismaService.savingsPlan.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return null;
    }

    return this.prismaService.savingsPlan.update({
      where: { id },
      data: {
        name: dto.name,
        isin: dto.isin,
        amount: dto.amount,
        interval: dto.interval,
        dayOfMonth: dto.dayOfMonth,
        category: dto.category,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        accountId: dto.accountId,
        accountUserId: dto.accountId ? userId : undefined
      },
      include: { account: { select: { id: true, name: true } } }
    });
  }

  async deleteSavingsPlan(id: string, userId: string) {
    const existing = await this.prismaService.savingsPlan.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return null;
    }

    return this.prismaService.savingsPlan.delete({
      where: { id }
    });
  }

  async getSavingsPlanSummary(userId: string) {
    const plans = await this.prismaService.savingsPlan.findMany({
      where: { userId, isActive: true }
    });

    const totalMonthly = plans.reduce((sum, plan) => {
      switch (plan.interval) {
        case 'DAILY':
          return sum + plan.amount * 30;
        case 'WEEKLY':
          return sum + plan.amount * 4.33;
        case 'MONTHLY':
          return sum + plan.amount;
        case 'QUARTERLY':
          return sum + plan.amount / 3;
        case 'YEARLY':
          return sum + plan.amount / 12;
        default:
          return sum + plan.amount;
      }
    }, 0);

    const byCategory: Record<string, number> = {};
    for (const plan of plans) {
      const cat = plan.category || 'OTHER';
      byCategory[cat] = (byCategory[cat] || 0) + plan.amount;
    }

    return {
      totalPlans: plans.length,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      byCategory,
      byInterval: {
        DAILY: plans.filter((p) => p.interval === 'DAILY').length,
        WEEKLY: plans.filter((p) => p.interval === 'WEEKLY').length,
        MONTHLY: plans.filter((p) => p.interval === 'MONTHLY').length,
        QUARTERLY: plans.filter((p) => p.interval === 'QUARTERLY').length,
        YEARLY: plans.filter((p) => p.interval === 'YEARLY').length
      }
    };
  }
}
