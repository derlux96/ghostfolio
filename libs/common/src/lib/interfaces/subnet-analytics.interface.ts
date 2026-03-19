/**
 * TAO Subnet Analytics Dashboard Interfaces
 *
 * Data structures for the TAO Bittensor Subnet Analytics Dashboard.
 * Combines data from TaoStats API and CoinGecko/GeckoTerminal for subnet token prices.
 */

/**
 * Raw subnet data from TaoStats API
 */
export interface TaoStatsSubnet {
  netuid: number;
  metadata?: {
    name?: string;
    description?: string;
    github?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    weave?: string;
  };
  emission: number;
  projected_emission?: number;
  tao_flow: number;
  net_flow_1_day: number;
  net_flow_7_days: number;
  net_flow_30_days: number;
  bonds_moving_avg?: number;
  active_keys?: number;
  validators?: number;
  active_validators?: number;
  active_miners?: number;
  active_dual?: number;
  modality?: string;
  difficulty?: number;
  subtoken_enabled?: boolean;
  excess_tao?: number;
  rho?: number;
  kappa?: number;
  recycled_lifetime?: number;
  recycled_24_hours?: number;
  fee_rate?: number;
  blocks_until_next_epoch?: number;
  tempo?: number;
  trust?: number;
  incentive?: number;
  dividends?: number;
  emissions?: number;
  last_update?: number;
}

/**
 * Subnet token price data from CoinGecko/GeckoTerminal
 */
export interface SubnetTokenPrice {
  symbol: string; // TAO, AFFINE, TEMPLAR, etc.
  name: string;
  priceUsd: number;
  priceChange24h?: number;
  marketCapUsd?: number;
  lastUpdated?: string;
}

/**
 * Combined subnet data with token price information
 */
export interface SubnetData extends TaoStatsSubnet {
  tokenPrice?: SubnetTokenPrice;
  isTracked: boolean;
}

/**
 * User's subnet portfolio with P&L calculations
 */
export interface SubnetPortfolio {
  netuid: number;
  name: string;
  symbol?: string;
  amount: number; // Amount of subnet tokens held
  priceUsd: number;
  valueUsd: number;
  priceChange24h?: number;
  emission?: number;
  taoFlow?: number;
  netFlow1Day?: number;
  netFlow7Days?: number;
  netFlow30Days?: number;
}

/**
 * Summary statistics for the dashboard
 */
export interface SubnetAnalyticsSummary {
  totalSubnets: number;
  trackedSubnets: number;
  totalEmission: number;
  totalTaoFlow: number;
  portfolioValue?: number;
  portfolioChange24h?: number;
}

/**
 * Subnet ranking by various metrics
 */
export interface SubnetRanking {
  netuid: number;
  name: string;
  rank: number;
  value: number;
  metric:
    | 'emission'
    | 'tao_flow'
    | 'net_flow_1_day'
    | 'net_flow_7_days'
    | 'net_flow_30_days';
}

/**
 * Response from GET /api/v1/subnet-analytics/subnets
 */
export interface SubnetsResponse {
  subnets: SubnetData[];
  summary: SubnetAnalyticsSummary;
  lastUpdated: string;
}

/**
 * Response from GET /api/v1/subnet-analytics/subnets/:netuid
 */
export interface SubnetDetailResponse extends SubnetData {
  historicalData?: HistoricalSubnetData[];
}

/**
 * Historical subnet data point
 */
export interface HistoricalSubnetData {
  date: string;
  emission: number;
  taoFlow: number;
  priceUsd?: number;
}

/**
 * Response from GET /api/v1/subnet-analytics/tokens/prices
 */
export interface SubnetTokenPricesResponse {
  prices: SubnetTokenPrice[];
  lastUpdated: string;
}

/**
 * Response from GET /api/v1/subnet-analytics/portfolio
 */
export interface SubnetPortfolioResponse {
  portfolio: SubnetPortfolio[];
  summary: {
    totalValue: number;
    totalChange24h: number;
    subnetCount: number;
  };
  lastUpdated: string;
}

/**
 * Response from GET /api/v1/subnet-analytics/emissions/rankings
 */
export interface SubnetRankingsResponse {
  rankings: {
    emission: SubnetRanking[];
    taoFlow: SubnetRanking[];
    netFlow1Day: SubnetRanking[];
    netFlow7Days: SubnetRanking[];
    netFlow30Days: SubnetRanking[];
  };
  lastUpdated: string;
}
