import type {
  SubnetAnalyticsSummary,
  SubnetData,
  SubnetRanking,
  SubnetTokenPrice
} from '@ghostfolio/common/interfaces';

import { Injectable, Logger } from '@nestjs/common';

const TAOSTATS_API = 'https://dash.taostats.io/api';

// Known subnet tokens with CoinGecko IDs (netuid → CoinGecko mapping)
const SUBNET_TOKENS: Record<
  number,
  { id: string; symbol: string; name: string }
> = {
  3: { id: 'templar', symbol: 'TAO', name: 'Templar' },
  75: { id: 'hippius', symbol: 'HIPPI', name: 'Hippius' },
  120: { id: 'affine', symbol: 'AFFINE', name: 'Affine' }
};

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

@Injectable()
export class SubnetAnalyticsService {
  private readonly logger = new Logger(SubnetAnalyticsService.name);
  private cache: {
    data: SubnetData[];
    summary: SubnetAnalyticsSummary;
    timestamp: number;
  } | null = null;
  private cacheTtl = 5 * 60 * 1000; // 5 minutes

  async getAllSubnets(): Promise<{
    subnets: SubnetData[];
    summary: SubnetAnalyticsSummary;
  }> {
    const now = Date.now();

    if (this.cache && now - this.cache.timestamp < this.cacheTtl) {
      return { subnets: this.cache.data, summary: this.cache.summary };
    }

    try {
      const response = await fetch(`${TAOSTATS_API}/subnet?per_page=129`);
      if (!response.ok) {
        throw new Error(`TaoStats API error: ${response.status}`);
      }
      const rawSubnets: Record<string, unknown>[] = await response.json();

      // Fetch token prices in parallel
      const tokenPrices = await this.fetchTokenPrices();

      const subnets: SubnetData[] = rawSubnets.map((s) => {
        const netuid = s.netuid as number;
        const tokenInfo = SUBNET_TOKENS[netuid];
        return {
          netuid,
          metadata: s.metadata as SubnetData['metadata'],
          emission: (s.emission as number) ?? 0,
          projected_emission: s.projected_emission as number | undefined,
          tao_flow: (s.ema_tao_flow as number) ?? 0,
          net_flow_1_day: (s.net_flow_1_day as number) ?? 0,
          net_flow_7_days: (s.net_flow_7_days as number) ?? 0,
          net_flow_30_days: (s.net_flow_30_days as number) ?? 0,
          bonds_moving_avg: s.bonds_moving_avg as number | undefined,
          active_keys: (s.active_keys as number) ?? 0,
          validators: s.validators as number | undefined,
          active_validators: (s.active_validators as number) ?? 0,
          active_miners: (s.active_miners as number) ?? 0,
          active_dual: (s.active_dual as number) ?? 0,
          modality: (s.modality as string) ?? '',
          difficulty: s.difficulty as number | undefined,
          subtoken_enabled: s.subtoken_enabled as boolean | undefined,
          excess_tao: s.excess_tao as number | undefined,
          rho: s.rho as number | undefined,
          kappa: s.kappa as number | undefined,
          recycled_lifetime: s.recycled_lifetime as number | undefined,
          recycled_24_hours: s.recycled_24_hours as number | undefined,
          fee_rate: s.fee_rate as number | undefined,
          blocks_until_next_epoch: s.blocks_until_next_epoch as
            | number
            | undefined,
          tempo: s.tempo as number | undefined,
          trust: s.trust as number | undefined,
          incentive: s.incentive as number | undefined,
          dividends: s.dividends as number | undefined,
          emissions: s.emissions as number | undefined,
          last_update: s.last_update as number | undefined,
          tokenPrice: tokenInfo ? tokenPrices[tokenInfo.id] : undefined,
          isTracked: !!tokenInfo
        };
      });

      const totalEmission = subnets.reduce((sum, s) => sum + s.emission, 0);
      const totalTaoFlow = subnets.reduce((sum, s) => sum + s.tao_flow, 0);
      const trackedCount = subnets.filter((s) => s.isTracked).length;

      const summary: SubnetAnalyticsSummary = {
        totalSubnets: subnets.length,
        trackedSubnets: trackedCount,
        totalEmission,
        totalTaoFlow
      };

      this.cache = { data: subnets, summary, timestamp: now };
      return { subnets, summary };
    } catch (error) {
      this.logger.error(`Failed to fetch subnet data: ${error}`);

      // Return stale cache if available
      if (this.cache) {
        return { subnets: this.cache.data, summary: this.cache.summary };
      }

      throw error;
    }
  }

  async getSubnet(netuid: number): Promise<SubnetData | null> {
    const { subnets } = await this.getAllSubnets();
    return subnets.find((s) => s.netuid === netuid) ?? null;
  }

  async getTokenPrices(): Promise<SubnetTokenPrice[]> {
    const prices = await this.fetchTokenPrices();
    return Object.entries(prices).map(([, price]) => price);
  }

  getEmissionRankings(subnets: SubnetData[]): SubnetRanking[] {
    return this.rankByMetric(subnets, 'emission');
  }

  getTaoFlowRankings(subnets: SubnetData[]): SubnetRanking[] {
    return this.rankByMetric(subnets, 'tao_flow');
  }

  getNetFlowRankings(
    subnets: SubnetData[],
    period: '1d' | '7d' | '30d'
  ): SubnetRanking[] {
    const metricMap = {
      '1d': 'net_flow_1_day',
      '7d': 'net_flow_7_days',
      '30d': 'net_flow_30_days'
    } as const;
    const metricKey = metricMap[period];
    return this.rankByMetric(subnets, metricKey);
  }

  private rankByMetric(
    subnets: SubnetData[],
    metric:
      | 'emission'
      | 'tao_flow'
      | 'net_flow_1_day'
      | 'net_flow_7_days'
      | 'net_flow_30_days'
  ): SubnetRanking[] {
    return subnets
      .map((s) => ({
        netuid: s.netuid,
        name: s.metadata?.name ?? `Subnet ${s.netuid}`,
        rank: 0,
        value: s[metric],
        metric
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  private async fetchTokenPrices(): Promise<Record<string, SubnetTokenPrice>> {
    const prices: Record<string, SubnetTokenPrice> = {};
    const ids = Object.values(SUBNET_TOKENS)
      .map((t) => t.id)
      .join(',');

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&last_updated=true`
      );
      if (!response.ok) {
        this.logger.warn(`CoinGecko API error: ${response.status}`);
        return prices;
      }
      const data = await response.json();

      for (const [id, info] of Object.entries(data)) {
        const infoRecord = info as Record<string, unknown>;
        const tokenMeta = Object.values(SUBNET_TOKENS).find((t) => t.id === id);
        prices[id] = {
          symbol: tokenMeta?.symbol ?? id.toUpperCase(),
          name: tokenMeta?.name ?? id,
          priceUsd: (infoRecord.usd as number) ?? 0,
          priceChange24h: infoRecord.usd_24h_change as number | undefined,
          marketCapUsd: infoRecord.usd_market_cap as number | undefined,
          lastUpdated: infoRecord.last_updated_at as string | undefined
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch token prices: ${error}`);
    }

    return prices;
  }
}
