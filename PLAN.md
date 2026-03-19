# Ghostfolio Custom Fork Implementation Plan

**For:** Lux (German investor on Trade Republic)
**Portfolio:** ~51,591 EUR, 40 positions, 26 savings plans (~890 EUR/month)
**Goal:** 3,000 EUR/month dividends in ~20 years (currently 1,251 EUR/year)

---

## Architecture Overview

Ghostfolio is an **Nx monorepo** with:

- **Backend:** NestJS API (`/apps/api/src`)
- **Frontend:** Angular 17+ (`/apps/client/src`)
- **Database:** PostgreSQL with Prisma ORM
- **Shared Libraries:** `/libs/common`, `/libs/ui`

---

## FEATURE 1: Enhanced Dividend Dashboard

### What Exists

- Basic dividend tracking in `/apps/api/src/app/import/import.service.ts` (lines 59-100)
- Dividends shown in Analysis page with monthly/yearly grouping
- `dividendsByGroup` in `GfAnalysisPageComponent`

### What Needs Building

1. **Dedicated Dividend Dashboard Page** (NEW)
   - Monthly dividend tracking calendar
   - Forward dividend yield projection
   - Dividend growth rate over time
   - Goal progress tracker (current → 3,000 EUR/month)
   - Annual dividend summary with tax estimates

2. **API Enhancements**
   - New endpoint: `GET /api/dividend/dashboard`
   - New DTOs: `DividendDashboardData`, `DividendProjection`
   - Enhanced dividend aggregation in `ImportService`

3. **Frontend Components**
   - New page: `/apps/client/src/app/pages/dividend/`
   - Components:
     - `dividend-calendar.component` - Monthly heatmap
     - `dividend-projection.component` - Forward yield calculator
     - `dividend-goal-tracker.component` - Progress to 3k/month
     - `dividend-summary.component` - Annual overview

### Files to Create/Modify

```
NEW: /apps/api/src/app/dividend/
  - dividend.controller.ts (new controller)
  - dividend.service.ts (enhanced dividend logic)
  - dividend.module.ts
  - dividend.dto.ts

NEW: /apps/client/src/app/pages/dividend/
  - dividend-page.component.ts/html/scss
  - dividend-calendar.component.ts/html/scss
  - dividend-projection.component.ts/html/scss
  - dividend-goal-tracker.component.ts/html/scss
  - dividend-page.routes.ts

MODIFY: /apps/client/src/app/pages/home/
  - Add dividend summary widget to home overview

MODIFY: /prisma/schema.prisma
  - Add DividendGoal model for tracking user targets
```

### Estimated Time

- Backend: 12 hours
- Frontend: 16 hours
- Testing: 6 hours
- **Total: ~34 hours**

---

## FEATURE 2: Savings Plan Tracking

### What Exists

- Basic Account tracking in `/apps/api/src/app/account/`
- No dedicated savings plan functionality

### What Needs Building

1. **Savings Plan Data Model** (NEW)
   - Store 26 savings plans with individual rates
   - Track monthly contributions per plan
   - Auto-categorization by type (Dividend, Spec, Growth, etc.)

2. **Savings Plan Dashboard**
   - Overview of all 26 plans
   - Dynamic rate adjustment interface
   - Monthly contribution summary (~890 EUR total)
   - Plan history and modifications
   - Impact on dividend projections

3. **Integration with Activities**
   - Auto-tag savings plan purchases
   - Reconcile imported activities with plans

### Files to Create/Modify

````
NEW: /apps/api/src/app/savings-plan/
  - savings-plan.controller.ts
  - savings-plan.service.ts
  - savings-plan.module.ts
  - savings-plan.dto.ts
  - savings-plan.model.ts (Prisma)

NEW: /apps/client/src/app/pages/savings-plans/
  - savings-plans-page.component.ts/html/scss
  - savings-plan-card.component.ts/html/scss
  - savings-plan-calendar.component.ts/html/scss
  - savings-plan-summary.component.ts/html/scss
  - savings-plans.routes.ts

NEW: /apps/client/src/app/components/savings-plan-overview/
  - savings-plan-overview.component.ts/html/scss

MODIFY: /prisma/schema.prisma
  - Add SavingsPlan model:
    ```
    model SavingsPlan {
      id              String   @id @default(uuid())
      name            String
      isin            String?
      amount          Float
      interval        String   @default("MONTHLY")
      dayOfMonth      Int      @default(1)
      category        String?  // Dividend, Spec, Growth, etc.
      isActive        Boolean  @default(true)
      startDate       DateTime @default(now())
      endDate         DateTime?
      user            User     @relation(fields: [userId], ...)
      userId          String
      createdAt       DateTime @default(now())
      updatedAt       DateTime @updatedAt
    }
    ```

MODIFY: /apps/api/src/app/import/import.service.ts
  - Auto-match activities to savings plans

MODIFY: /apps/client/src/app/pages/accounts/
  - Add savings plan view tab
````

### Estimated Time

- Backend: 16 hours
- Frontend: 20 hours
- Testing: 8 hours
- **Total: ~44 hours**

---

## FEATURE 3: Custom Allocation View

### What Exists

- Allocations page at `/apps/client/src/app/pages/portfolio/allocations/`
- Supports: Platform, Currency, Asset Class, Country, Continent
- Uses existing `Tag` system for categorization

### What Needs Building

1. **Custom Tag-Based Categories**
   - Create Lux-specific tags: Gold, Dividend, Spec, Russia, Growth
   - Set target allocations per category
   - Visual comparison: Actual vs Target

2. **Rebalancing Assistant**
   - Calculate drift from targets
   - Suggest trades to rebalance
   - Impact of rebalancing on fees/taxes

3. **Custom Allocation Dashboard**
   - Donut chart for current allocation
   - Target allocation comparison
   - Rebalancing recommendations

### Files to Create/Modify

````
NEW: /apps/api/src/app/allocation/
  - allocation.controller.ts
  - allocation.service.ts (rebalancing logic)
  - allocation.module.ts
  - allocation.dto.ts

NEW: /apps/client/src/app/pages/portfolio/custom-allocations/
  - custom-allocations-page.component.ts/html/scss
  - allocation-comparison.component.ts/html/scss
  - rebalancing-suggestions.component.ts/html/scss
  - custom-allocations.routes.ts

MODIFY: /apps/api/src/app/tag/tag.service.ts
  - Add bulk tag creation for categories
  - Add target allocation per tag

MODIFY: /prisma/schema.prisma
  - Extend Tag model:
    ```
    model Tag {
      ...
      targetAllocation Float?  // Target percentage (0-1)
      color            String? // Display color
    }
    ```

MODIFY: /apps/client/src/app/pages/portfolio/allocations/
  - Add custom category tab
  - Integrate with existing charts
````

### Estimated Time

- Backend: 10 hours
- Frontend: 14 hours
- Testing: 6 hours
- **Total: ~30 hours**

---

## FEATURE 4: Trade Republic CSV Import

### What Exists

- Generic import in `/apps/api/src/app/import/import.service.ts`
- CSV parsing capabilities exist
- Manual activity entry

### What Needs Building

1. **Trade Republic CSV Parser** (NEW)
   - Parse TR export format (headers, date format, decimal separator)
   - Handle TR-specific fields:
     - "Einbuchung" (deposit)
     - "Dividende" (dividend)
     - "Kauf" (buy)
     - "Verkauf" (sell)
     - " Sparplan" (savings plan)

2. **Auto-Categorization**
   - Map ISINs to Lux's categories (Gold/Div/Spec/Russia/Growth)
   - Auto-assign tags based on holdings
   - Match to savings plans

3. **Import UI**
   - Drag-and-drop CSV upload
   - Preview before import
   - Validation and error handling
   - Bulk category assignment

### Files to Create/Modify

```
NEW: /apps/api/src/app/import/
  - import-tr.service.ts (TR-specific parser)
  - import-tr.dto.ts
  - isin-category-mapping.ts (ISIN → category lookup)

NEW: /apps/client/src/app/pages/import/
  - import-page.component.ts/html/scss
  - csv-upload.component.ts/html/scss
  - import-preview.component.ts/html/scss
  - import.routes.ts

MODIFY: /apps/api/src/app/import/import.service.ts
  - Add TR format handler
  - Add auto-tagging logic

NEW: /prisma/schema.prisma (optional)
  - ImportHistory model for tracking uploads
```

### Trade Republic CSV Format Example

```csv
Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
01.01.2024;IE00B4L5Y983;Kauf;123456;10;EUR;100.00;1000.00;1.00;1001.00
```

### Files to Create/Modify

```
Estimated Time
- Parser development: 12 hours
- Auto-categorization: 8 hours
- UI development: 12 hours
- Testing with real TR exports: 6 hours
- **Total: ~38 hours**
```

---

## FEATURE 5: Telegram Integration

### What Exists

- Twitter bot service in `/apps/api/src/app/services/twitter-bot/` (can use as template)
- No Telegram integration exists

### What Needs Building

1. **Telegram Bot API**
   - Bot registration and webhook handling
   - User authentication (chat_id mapping)
   - Command handlers: /summary, /dividends, /updates

2. **Notification System**
   - Daily/weekly portfolio summary
   - Dividend payment alerts
   - Savings plan execution notifications
   - Rebalancing reminders

3. **User Settings**
   - Connect/disconnect Telegram
   - Notification preferences
   - Custom message format

### Files to Create/Modify

````
NEW: /apps/api/src/app/telegram/
  - telegram.controller.ts (webhook)
  - telegram.service.ts (bot logic)
  - telegram.module.ts
  - telegram.dto.ts

NEW: /apps/api/src/services/telegram-bot/
  - telegram-bot.service.ts
  - telegram-notification.service.ts

MODIFY: /apps/client/src/app/pages/user-account-settings/
  - Add Telegram connection UI
  - Notification preferences

MODIFY: /prisma/schema.prisma
  - Add TelegramConnection model:
    ```
    model TelegramConnection {
      id        String   @id @default(uuid())
      chatId    String   @unique
      userId    String
      user      User     @relation(fields: [userId], ...)
      isActive  Boolean  @default(true)
      createdAt DateTime @default(now())
    }
    ```

NEW: /apps/client/src/app/components/telegram-settings/
  - telegram-settings.component.ts/html/scss
````

### Telegram Commands

```
/summary - Current portfolio value and P&L
/dividends - Recent dividend payments
/goals - Progress toward 3k/month goal
/savings - Active savings plans overview
/updates - Toggle notifications
```

### Estimated Time

- Bot setup: 8 hours
- Notification service: 12 hours
- Frontend settings: 6 hours
- Testing: 6 hours
- **Total: ~32 hours**

---

## FEATURE 6: German Tax Reporting

### What Exists

- Basic export functionality in `/apps/api/src/app/export/`
- No German-specific tax calculations

### What Needs Building

1. **German Tax Calculation Engine**
   - Teilfreistellung (partial exemption) calculation
   - Vorabpauschale (anticipatory tax) tracking
   - Tax year summary
   - Export-ready for ELSTER/Datev formats

2. **Tax Report Dashboard**
   - Annual tax summary
   - Per-position tax details
   - Dividend tax breakdown
   - Realized gains/losses

3. **Export Formats**
   - CSV for tax software
   - PDF summary for records

### Files to Create/Modify

````
NEW: /apps/api/src/app/tax/
  - tax.controller.ts
  - tax.service.ts (German tax logic)
  - tax.module.ts
  - tax.dto.ts
  - german-tax-calculator.service.ts

NEW: /apps/api/src/services/german-tax/
  - teilfreistellung.service.ts
  - vorabpauschale.service.ts
  - tax-year-report.service.ts

NEW: /apps/client/src/app/pages/tax/
  - tax-page.component.ts/html/scss
  - tax-summary.component.ts/html/scss
  - tax-position-details.component.ts/html/scss
  - tax-export.component.ts/html/scss
  - tax.routes.ts

MODIFY: /prisma/schema.prisma
  - Add TaxEvent model:
    ```
    model TaxEvent {
      id                String   @id @default(uuid())
      userId            String
      type              String   // DIVIDEND, SALE, VORABPAUSCHALE
      amount            Float
      taxAmount         Float
      teilfreistellung  Float?
      date              DateTime
      relatedOrderId    String?
      user              User     @relation(fields: [userId], ...)
    }
    ```
````

### German Tax Rules to Implement

1. **Teilfreistellung** (partial exemption for dividends/foreign funds)
   - 30% for Aktien (stocks)
   - 15% for certain ETFs/mixed funds

2. **Vorabpauschale** (anticipatory tax for ETFs)
   - Calculated daily when price > reference
   - Applied at year-end or sale

3. **Tax Rates**
   - Abgeltungsteuer: 26.375% (including Soli)
   - Kirchensteuer: 8-9% on Abgeltungsteuer (if applicable)

### Estimated Time

- Tax engine: 20 hours
- Frontend dashboard: 12 hours
- Export functionality: 8 hours
- Testing with tax advisor: 8 hours
- **Total: ~48 hours**

---

## IMPLEMENTATION PRIORITY & PHASING

### Phase 1: Core Functionality (Weeks 1-4)

1. **Trade Republic CSV Import** (38h) - Foundation for data entry
2. **Custom Allocation View** (30h) - Basic portfolio organization
3. **Tag-based Categories** (included above)

### Phase 2: Enhanced Tracking (Weeks 5-8)

4. **Savings Plan Tracking** (44h) - Manage 26 plans
5. **Enhanced Dividend Dashboard** (34h) - Goal tracking

### Phase 3: Automation & Reporting (Weeks 9-12)

6. **Telegram Integration** (32h) - Notifications
7. **German Tax Reporting** (48h) - Compliance

---

## TOTAL ESTIMATE

- **Phase 1:** 68 hours (~2 weeks)
- **Phase 2:** 78 hours (~2.5 weeks)
- **Phase 3:** 80 hours (~2.5 weeks)

**Grand Total: ~226 hours (~6-7 weeks full-time)**

---

## TECHNICAL NOTES

### Database Changes

All Prisma schema changes require migration:

```bash
cd /tmp/ghostfolio-fork
npx prisma migrate dev --name custom_features
```

### Environment Variables Needed

```
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_WEBHOOK_SECRET=xxx
TAX_YEAR=2024
BASE_CURRENCY=EUR
```

### Dependencies to Add

```json
{
  "telegraf": "4.x", // Telegram bot framework
  "csv-parse": "5.x", // Enhanced CSV parsing
  "ical": "latest" // Calendar export (if needed)
}
```

### Development Workflow

1. Create feature branch: `git checkout -b feature/xyz`
2. Implement changes
3. Run tests: `nx test api && nx test client`
4. Build: `nx build api && nx build client`
5. Test locally with sample TR export

---

## NEXT STEPS

1. **Set up development environment**
   - Install dependencies: `npm install`
   - Set up local PostgreSQL
   - Configure `.env.dev`

2. **Create initial data migration**
   - Add Prisma models for new features

3. **Begin Phase 1**
   - Start with TR CSV import (highest priority)

4. **Testing strategy**
   - Use Lux's actual portfolio data
   - Validate with real TR exports
   - Test tax calculations with professional advisor

---

_Generated: 2025-03-18_
_Repository: https://github.com/ghostfolio/ghostfolio_
_Target User: Lux (derlux96)_
