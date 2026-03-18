import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import {
  AllocationTargetDto,
  RebalancingAction
} from '@ghostfolio/common/dtos';

import { Injectable } from '@nestjs/common';
import { DataSource } from '@prisma/client';

@Injectable()
export class AllocationService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async getCustomAllocations({
    impersonationId,
    userId
  }: {
    impersonationId?: string;
    userId: string;
  }): Promise<{
    items: Array<{
      tagId: string;
      tagName: string;
      currentAllocation: number;
      targetAllocation: number;
      currentValue: number;
      targetValue: number;
      color?: string;
      drift: number;
    }>;
    totalValue: number;
    totalTargetAllocation: number;
    hasDrift: boolean;
    rebalancingActions: RebalancingAction[];
  }> {
    const effectiveUserId = impersonationId || userId;

    // Get all tags with target allocations
    const tags = await this.prismaService.tag.findMany({
      where: {
        OR: [{ userId: effectiveUserId }, { userId: null }]
      }
    });

    // Get portfolio positions for tag-based allocation calculation
    const orders = await this.prismaService.order.findMany({
      where: {
        userId: effectiveUserId,
        type: { in: ['BUY', 'SELL'] }
      },
      include: {
        SymbolProfile: true,
        tags: true
      }
    });

    // Calculate holdings by tag
    const tagValueMap = new Map<string, number>();
    let totalPortfolioValue = 0;

    // Group orders by symbol and calculate quantity
    const symbolQuantityMap = new Map<string, number>();
    const symbolTagMap = new Map<string, string[]>();
    const symbolDataSourceMap = new Map<string, DataSource>();

    for (const order of orders) {
      const symbol = order.SymbolProfile.symbol;
      const dataSource = order.SymbolProfile.dataSource;

      symbolDataSourceMap.set(symbol, dataSource);

      if (!symbolQuantityMap.has(symbol)) {
        symbolQuantityMap.set(symbol, 0);
      }

      if (order.type === 'BUY') {
        symbolQuantityMap.set(
          symbol,
          symbolQuantityMap.get(symbol)! + order.quantity
        );
      } else if (order.type === 'SELL') {
        symbolQuantityMap.set(
          symbol,
          symbolQuantityMap.get(symbol)! - order.quantity
        );
      }

      // Track tags for this symbol
      if (!symbolTagMap.has(symbol)) {
        symbolTagMap.set(symbol, []);
      }
      for (const tag of order.tags) {
        if (!symbolTagMap.get(symbol)!.includes(tag.id)) {
          symbolTagMap.get(symbol)!.push(tag.id);
        }
      }
    }

    // Get current market prices for holdings
    for (const [symbol, quantity] of symbolQuantityMap.entries()) {
      if (quantity > 0) {
        const dataSource = symbolDataSourceMap.get(symbol)!;
        const latestData = await this.prismaService.marketData.findFirst({
          where: {
            symbol,
            dataSource
          },
          orderBy: {
            date: 'desc'
          }
        });

        if (latestData) {
          const value = quantity * latestData.marketPrice;
          totalPortfolioValue += value;

          // Add value to each tag associated with this symbol
          const tagsForSymbol = symbolTagMap.get(symbol) || [];
          for (const tagId of tagsForSymbol) {
            tagValueMap.set(tagId, (tagValueMap.get(tagId) || 0) + value);
          }
        }
      }
    }

    // Build allocation items
    const items: Array<{
      tagId: string;
      tagName: string;
      currentAllocation: number;
      targetAllocation: number;
      currentValue: number;
      targetValue: number;
      color?: string;
      drift: number;
    }> = [];

    let totalTargetAllocation = 0;
    let hasDrift = false;

    for (const tag of tags) {
      if (tag.targetAllocation && tag.targetAllocation > 0) {
        const currentValue = tagValueMap.get(tag.id) || 0;
        const currentAllocation =
          totalPortfolioValue > 0 ? currentValue / totalPortfolioValue : 0;
        const targetAllocation = tag.targetAllocation;
        const targetValue = totalPortfolioValue * targetAllocation;
        const drift = currentAllocation - targetAllocation;

        if (Math.abs(drift) > 0.01) {
          // 1% tolerance
          hasDrift = true;
        }

        totalTargetAllocation += targetAllocation;

        items.push({
          tagId: tag.id,
          tagName: tag.name,
          currentAllocation,
          targetAllocation,
          currentValue,
          targetValue,
          color: tag.color || undefined,
          drift
        });
      }
    }

    // Calculate rebalancing actions
    const rebalancingActions: RebalancingAction[] = [];

    for (const item of items) {
      const valueDiff = item.targetValue - item.currentValue;
      const percentageDiff = item.targetAllocation - item.currentAllocation;

      if (Math.abs(percentageDiff) > 0.01) {
        // 1% tolerance
        rebalancingActions.push({
          tagId: item.tagId,
          tagName: item.tagName,
          type: percentageDiff > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(valueDiff),
          percentage: Math.abs(percentageDiff),
          currentAllocation: item.currentAllocation,
          targetAllocation: item.targetAllocation
        });
      }
    }

    // Sort by action type (BUY first, then SELL) and by percentage descending
    rebalancingActions.sort((a, b) => {
      if (a.type === b.type) {
        return b.percentage - a.percentage;
      }
      return a.type === 'BUY' ? -1 : 1;
    });

    return {
      items,
      totalValue: totalPortfolioValue,
      totalTargetAllocation,
      hasDrift,
      rebalancingActions
    };
  }

  public async setAllocationTargets({
    targets,
    userId: _userId
  }: {
    targets: AllocationTargetDto[];
    userId: string;
  }): Promise<void> {
    for (const target of targets) {
      await this.prismaService.tag.update({
        data: {
          targetAllocation: target.targetAllocation,
          color: target.color
        },
        where: {
          id: target.tagId
        }
      });
    }
  }
}
