import { TagService } from '@ghostfolio/api/services/tag/tag.service';

import { Test } from '@nestjs/testing';

import { TrTransactionType } from './import-tr.dto';
import { ImportTrService } from './import-tr.service';

describe('ImportTrService', () => {
  let service: ImportTrService;

  const mockTagService = {
    getTagsForUser: jest.fn()
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ImportTrService,
        {
          provide: TagService,
          useValue: mockTagService
        }
      ]
    }).compile();

    service = module.get(ImportTrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseTrCsv', () => {
    const validCsvData = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
01.01.2024;IE00B4L5Y983;Kauf;123456;10;EUR;100,00;1000,00;1,00;1001,00
15.01.2024;IE00B8GKDB10;Dividende;123457;0;EUR;1,50;50,00;0,00;50,00
20.01.2024;IE00BKM4GZ66;Verkauf;123458;5;EUR;110,00;550,00;1,00;549,00`;

    it('should parse valid CSV data', async () => {
      const result = await service.parseTrCsv(validCsvData);

      expect(result.activities).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalActivities).toBe(3);
      expect(result.summary.buyCount).toBe(1);
      expect(result.summary.dividendCount).toBe(1);
      expect(result.summary.sellCount).toBe(1);
    });

    it('should handle German date format (DD.MM.YYYY)', async () => {
      const result = await service.parseTrCsv(validCsvData);

      expect(result.activities[0].date).toEqual(new Date(2024, 0, 1));
      expect(result.activities[1].date).toEqual(new Date(2024, 0, 15));
    });

    it('should handle German number format with comma decimal separator', async () => {
      const result = await service.parseTrCsv(validCsvData);

      expect(result.activities[0].unitPrice).toBe(100.0);
      expect(result.activities[0].quantity).toBe(10);
      expect(result.activities[0].amount).toBe(1000.0);
      expect(result.activities[0].fee).toBe(1.0);
    });

    it('should skip deposit and withdrawal transactions', async () => {
      const csvWithDeposit = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
01.01.2024;IE00B4L5Y983;Kauf;123456;10;EUR;100,00;1000,00;1,00;1001,00
02.01.2024;;Einbuchung;123457;;EUR;1,00;500,00;0,00;500,00`;

      const result = await service.parseTrCsv(csvWithDeposit);

      expect(result.activities).toHaveLength(1);
      expect(result.summary.buyCount).toBe(1);
      expect(result.summary.depositCount).toBe(0); // Deposits are skipped
    });

    it('should detect and report invalid ISIN', async () => {
      const invalidCsv = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
01.01.2024;INVALID_ISIN;Kauf;123456;10;EUR;100,00;1000,00;1,00;1001,00`;

      const result = await service.parseTrCsv(invalidCsv);

      expect(result.activities).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid ISIN');
    });

    it('should detect and report invalid date format', async () => {
      const invalidDateCsv = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
2024-01-01;IE00B4L5Y983;Kauf;123456;10;EUR;100,00;1000,00;1,00;1001,00`;

      const result = await service.parseTrCsv(invalidDateCsv);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid date format');
    });

    it('should throw error for missing headers', async () => {
      const invalidCsv = `Datum;ISIN;Typ
01.01.2024;IE00B4L5Y983;Kauf`;

      await expect(service.parseTrCsv(invalidCsv)).rejects.toThrow(
        'Missing required columns'
      );
    });

    it('should handle empty CSV', async () => {
      await expect(service.parseTrCsv('')).rejects.toThrow(
        'CSV file is empty or missing data'
      );
    });

    it('should handle savings plan transactions', async () => {
      const savingsPlanCsv = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
01.01.2024;IE00B4L5Y983;Sparplan;123456;10;EUR;100,00;1000,00;1,00;1001,00`;

      const result = await service.parseTrCsv(savingsPlanCsv);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].type).toBe(TrTransactionType.SAVINGS_PLAN);
      expect(result.summary.savingsPlanCount).toBe(1);
    });

    it('should handle dividends with zero quantity', async () => {
      const dividendCsv = `Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
15.01.2024;IE00B8GKDB10;Dividende;123457;0;EUR;1,50;50,00;0,00;50,00`;

      const result = await service.parseTrCsv(dividendCsv);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].quantity).toBe(0);
      expect(result.activities[0].type).toBe(TrTransactionType.DIVIDEND);
    });
  });

  describe('convertToGhostfolioOrders', () => {
    const mockTags = [
      { id: 'tag1', name: 'Gold' },
      { id: 'tag2', name: 'Div' },
      { id: 'tag3', name: 'Growth' }
    ];

    beforeEach(() => {
      mockTagService.getTagsForUser.mockResolvedValue(mockTags);
    });

    it('should convert BUY transaction to Ghostfolio BUY order', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01'),
          isin: 'IE00B4L5Y983',
          type: TrTransactionType.BUY,
          quantity: 10,
          currency: 'EUR',
          unitPrice: 100,
          amount: 1000,
          fee: 1,
          total: 1001
        }
      ];

      const result = await service.convertToGhostfolioOrders(
        transactions,
        'account1'
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('BUY');
      expect(result[0].quantity).toBe(10);
      expect(result[0].unitPrice).toBe(100);
      expect(result[0].fee).toBe(1);
      expect(result[0].symbol).toBe('IE00B4L5Y983');
      expect(result[0].accountId).toBe('account1');
    });

    it('should convert SAVINGS_PLAN transaction to Ghostfolio BUY order', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01'),
          isin: 'IE00B4L5Y983',
          type: TrTransactionType.SAVINGS_PLAN,
          quantity: 10,
          currency: 'EUR',
          unitPrice: 100,
          amount: 1000,
          fee: 1,
          total: 1001
        }
      ];

      const result = await service.convertToGhostfolioOrders(
        transactions,
        'account1'
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('BUY');
    });

    it('should convert SELL transaction to Ghostfolio SELL order', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01'),
          isin: 'IE00B4L5Y983',
          type: TrTransactionType.SELL,
          quantity: 5,
          currency: 'EUR',
          unitPrice: 110,
          amount: 550,
          fee: 1,
          total: 549
        }
      ];

      const result = await service.convertToGhostfolioOrders(transactions);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('SELL');
    });

    it('should convert DIVIDEND transaction with zero quantity', async () => {
      const transactions = [
        {
          date: new Date('2024-01-15'),
          isin: 'IE00B8GKDB10',
          type: TrTransactionType.DIVIDEND,
          quantity: 0,
          currency: 'EUR',
          unitPrice: 1.5,
          amount: 50,
          fee: 0,
          total: 50
        }
      ];

      const result = await service.convertToGhostfolioOrders(transactions);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('DIVIDEND');
      expect(result[0].quantity).toBe(0);
      expect(result[0].unitPrice).toBe(50); // Use amount as unit price
    });

    it('should auto-tag activities based on ISIN category mapping', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01'),
          isin: 'IE00B4L5Y983', // Gold ISIN
          type: TrTransactionType.BUY,
          quantity: 10,
          currency: 'EUR',
          unitPrice: 100,
          amount: 1000,
          fee: 1,
          total: 1001
        }
      ];

      const result = await service.convertToGhostfolioOrders(transactions);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('tag1'); // Gold tag ID
    });

    it('should handle multiple transactions', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01'),
          isin: 'IE00B4L5Y983',
          type: TrTransactionType.BUY,
          quantity: 10,
          currency: 'EUR',
          unitPrice: 100,
          amount: 1000,
          fee: 1,
          total: 1001
        },
        {
          date: new Date('2024-01-15'),
          isin: 'IE00B8GKDB10',
          type: TrTransactionType.DIVIDEND,
          quantity: 0,
          currency: 'EUR',
          unitPrice: 50,
          amount: 50,
          fee: 0,
          total: 50
        }
      ];

      const result = await service.convertToGhostfolioOrders(transactions);

      expect(result).toHaveLength(2);
    });

    it('should format date as ISO string', async () => {
      const transactions = [
        {
          date: new Date('2024-01-01T00:00:00Z'),
          isin: 'IE00B4L5Y983',
          type: TrTransactionType.BUY,
          quantity: 10,
          currency: 'EUR',
          unitPrice: 100,
          amount: 1000,
          fee: 1,
          total: 1001
        }
      ];

      const result = await service.convertToGhostfolioOrders(transactions);

      expect(result[0].date).toBeDefined();
      expect(typeof result[0].date).toBe('string');
    });
  });
});
