/**
 * ISIN to Category Mapping for Lux's Portfolio
 *
 * Maps ISINs to custom categories:
 * - Gold: Gold-related assets
 * - Dividend: Dividend-focused stocks/funds
 * - Spec: Speculative investments
 * - Russia: Russian market exposure
 * - Growth: Growth-oriented investments
 */

export interface IsinCategoryMapping {
  isin: string;
  name: string;
  category: 'Gold' | 'Dividend' | 'Spec' | 'Russia' | 'Growth';
  tagName: string;
  color?: string;
}

/**
 * Default ISIN to category mapping
 * This can be extended with user-specific mappings
 */
export const DEFAULT_ISIN_CATEGORY_MAPPING: Record<
  string,
  IsinCategoryMapping
> = {
  // Gold holdings
  IE00B4L5Y983: {
    isin: 'IE00B4L5Y983',
    name: 'iShares Physical Gold',
    category: 'Gold',
    tagName: 'Gold',
    color: '#FFD700'
  },
  IE00B4ND3602: {
    isin: 'IE00B4ND3602',
    name: 'Xtrackers Physical Gold',
    category: 'Gold',
    tagName: 'Gold',
    color: '#FFD700'
  },

  // Dividend aristocrats / high yield
  IE00B8GKDB10: {
    isin: 'IE00B8GKDB10',
    name: 'Vanguard FTSE All-World High Dividend Yield',
    category: 'Dividend',
    tagName: 'Div',
    color: '#2E7D32'
  },
  IE00B4WXJJ64: {
    isin: 'IE00B4WXJJ64',
    name: 'Vanguard FTSE Developed Markets ETF',
    category: 'Dividend',
    tagName: 'Div',
    color: '#2E7D32'
  },
  DE000A1RRLV5: {
    isin: 'DE000A1RRLV5',
    name: 'iShares STOXX Global Select Dividend 100',
    category: 'Dividend',
    tagName: 'Div',
    color: '#2E7D32'
  },

  // Growth focused
  IE00BKM4GZ66: {
    isin: 'IE00BKM4GZ66',
    name: 'iShares Core MSCI World',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },
  IE00BF4RFH31: {
    isin: 'IE00BF4RFH31',
    name: 'iShares Core S&P 500',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },
  LU1737652258: {
    isin: 'LU1737652258',
    name: 'Amundi Prime MSCI World',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },
  LU1737652426: {
    isin: 'LU1737652426',
    name: 'Amundi Prime S&P 500',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },
  IE00B5BMR661: {
    isin: 'IE00B5BMR661',
    name: 'SPDR MSCI World',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },

  // Russia exposure
  LU0695704735: {
    isin: 'LU0695704735',
    name: 'VanEck Morningstar Developed Markets',
    category: 'Russia',
    tagName: 'Russia',
    color: '#D32F2F'
  },

  // Speculative / emerging markets
  IE00B2QYNC75: {
    isin: 'IE00B2QYNC75',
    name: 'Vanguard FTSE Emerging Markets',
    category: 'Spec',
    tagName: 'Spec',
    color: '#F57C00'
  },
  IE00B3Z0HQ74: {
    isin: 'IE00B3Z0HQ74',
    name: 'iShares Core MSCI Emerging Markets',
    category: 'Spec',
    tagName: 'Spec',
    color: '#F57C00'
  },

  // Tech/innovation (Growth)
  'IE00B3L TY758': {
    isin: 'IE00B3L TY758',
    name: 'iShares Global Tech',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  },
  DE000A2G6ML6: {
    isin: 'DE000A2G6ML6',
    name: 'Xtrackers MSCI World Information Technology',
    category: 'Growth',
    tagName: 'Growth',
    color: '#1976D2'
  }
};

/**
 * Get category mapping for an ISIN
 */
export function getCategoryForIsin(
  isin: string
): IsinCategoryMapping | undefined {
  return DEFAULT_ISIN_CATEGORY_MAPPING[isin];
}

/**
 * Get all known ISINs for a specific category
 */
export function getIsinsByCategory(category: string): IsinCategoryMapping[] {
  return Object.values(DEFAULT_ISIN_CATEGORY_MAPPING).filter(
    (mapping) => mapping.category === category
  );
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return [
    ...new Set(
      Object.values(DEFAULT_ISIN_CATEGORY_MAPPING).map((m) => m.category)
    )
  ];
}

/**
 * Add or update a category mapping
 */
export function setCategoryForIsin(mapping: IsinCategoryMapping): void {
  DEFAULT_ISIN_CATEGORY_MAPPING[mapping.isin] = mapping;
}
