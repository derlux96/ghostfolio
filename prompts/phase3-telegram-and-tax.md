You are continuing the implementation of a custom Ghostfolio fork for a German investor named Lux.

PROJECT CONTEXT:

- This is a fork of Ghostfolio (NestJS + Angular + Prisma + PostgreSQL)
- Phase 1 complete: TR CSV Import + Custom Allocation View
- Phase 2 complete: Savings Plan Tracking + Dividend Dashboard
- Read PLAN.md for full architecture details

CURRENT BRANCH: Start from feature/phase2-savings-and-dividends (or latest), create feature/phase3-telegram-and-tax

YOUR TASK: Implement Phase 3 — Telegram Integration + German Tax Reporting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK A: TELEGRAM INTEGRATION (32h estimated)

Build a Telegram bot that sends portfolio updates and responds to commands.

1. DATABASE - Add to prisma/schema.prisma:

```
model TelegramConnection {
  id        String   @id @default(uuid())
  chatId    String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. BACKEND - Create /apps/api/src/app/telegram/:
   - telegram.controller.ts
     - POST /api/telegram/webhook — Receive webhook from Telegram
     - GET /api/telegram/connect — Generate link to connect Telegram account
     - DELETE /api/telegram/disconnect — Disconnect Telegram
     - GET /api/telegram/status — Connection status
     - GET /api/telegram/test — Send test message
   - telegram.service.ts
     - Webhook handler: parse incoming messages, route to command handlers
     - Command handlers:
       /summary — Current portfolio value, today's P&L, total return
       /dividends — Last 5 dividend payments + monthly total
       /goals — Dividend goal progress (→3k/month)
       /savings — Active savings plans overview + monthly total
       /allocations — Current allocation vs targets (from Phase 1)
       /help — List available commands
     - Notification service (separate):
       - sendDividendAlert(userId, dividend) — When dividend received
       - sendDailySummary(userId) — Daily portfolio summary
       - sendWeeklyReport(userId) — Weekly performance report
       - sendSavingsPlanAlert(userId, plan) — When savings plan executes
   - telegram.module.ts
   - telegram.dto.ts

   Use node-telegram-bot-api or telegraf library. Add as dependency:
   npm install telegraf (or add to package.json)

   TELEGRAM_BOT_TOKEN should come from environment variable.

3. FRONTEND - Add Telegram settings to user account:
   - /apps/client/src/app/pages/user-account-settings/
     - Add Telegram section: Connect/Disconnect button, status indicator
     - Notification preferences: daily summary, dividend alerts, weekly report
   - Modify the existing user settings page to include Telegram section

4. TELEGRAM BOT FEATURES:
   - Portfolio summary format (example):
     "📊 Depot-Übersicht
     Wert: 51.591 EUR
     Heute: +0,8% (+412 EUR)
     Gesamt: +12,3% (+5.650 EUR)

     🥇 Gold: 49,2%
     💰 Dividenden: 37,8%
     🔥 Spec: 7,1%
     🇷🇺 Russia: 3,0%
     📈 Growth: 2,9%"

   - Dividend alert format:
     "💵 Dividende erhalten!
     IE00B4L5Y983 (VWCE)
     15,23 EUR
     Laufender Monat: 87,45 EUR / 104,17 EUR Ziel"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK B: GERMAN TAX REPORTING (48h estimated)

Build a basic German tax calculation and reporting system.

1. DATABASE - Add to prisma/schema.prisma:

```
model TaxEvent {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  type              String   // DIVIDEND, SALE, VORABPAUSCHALE, STORNO
  amount            Float
  taxAmount         Float
  teilfreistellung  Float?
  vorabpauschale    Float?
  rawAmount         Float    // Before Teilfreistellung
  date              DateTime
  accountId         String?
  account           Account? @relation(fields: [accountId], references: [id])
  orderId           String?  // Reference to original activity
  isin              String?
  currency          String?
  note              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model TaxSettings {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  taxRate         Float    @default(0.26375)  // Abgeltungsteuer + Soli
  kirchensteuer   Float?   // 0.08 or 0.09
  freistellung    Float    @default(1000)     // Sparer-Pauschbetrag
  teilfreistellungAktien Float @default(0.30) // 30%
  teilfreistellungEtfs    Float @default(0.15) // 15%
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

2. BACKEND - Create /apps/api/src/app/tax/:
   - tax.controller.ts
     - GET /api/tax/summary?year=2025 — Annual tax summary
     - GET /api/tax/positions?year=2025 — Per-position tax details
     - GET /api/tax/dividends?year=2025 — Dividend tax breakdown
     - GET /api/tax/settings — Get user tax settings
     - PUT /api/tax/settings — Update tax settings
     - GET /api/tax/export?year=2025&format=csv — Export tax data
     - POST /api/tax/vorabpauschale — Calculate Vorabpauschale for ETFs
   - tax.service.ts
     - GermanTaxCalculator:
       - calculateTeilfreistellung(amount, assetType) — 30% stocks, 15% ETFs
       - calculateVorabpauschale(etf, daysHeld, referencePrice, currentPrice)
       - calculateTax(grossAmount, assetType) — Full tax calculation chain
       - getTaxYearSummary(userId, year) — Annual totals
     - Generate tax reports
   - german-tax-calculator.service.ts (pure calculation logic, no DB)
   - teilfreistellung.service.ts
   - vorabpauschale.service.ts
   - tax.module.ts
   - tax.dto.ts

3. GERMAN TAX RULES TO IMPLEMENT:
   a) Teilfreistellung (partial exemption):
   - 30% for individual stocks (Aktien)
   - 15% for ETFs that invest >50% in stocks
   - 0% for bonds/money market funds

   b) Vorabpauschale (anticipatory tax for accumulating ETFs):
   - Only for thesaurierende (accumulating) ETFs
   - Calculated daily when: price > base rate \* reference price
   - Formula: 70% _ base rate _ (price - 1.2 _ reference price) _ shares
   - Capped at actual gains
   - Applied when held <1 year or at year end

   c) Tax rates:
   - Abgeltungsteuer: 25%
   - Solidaritätszuschlag: 5.5% of Abgeltungsteuer → total 26.375%
   - Kirchensteuer: 8-9% of Abgeltungsteuer (optional)
   - Sparer-Pauschbetrag: 1.000 EUR/year (2.000 for married)

4. FRONTEND - Create /apps/client/src/app/pages/tax/:
   - tax-page.component.ts/html/scss (main tax dashboard)
     - Year selector
     - Summary cards: Total dividends, Total tax, Remaining Freibetrag
     - Steuer-Last quote (effective tax rate)
   - tax-summary.component.ts/html/scss
     - Annual totals table
     - Chart: income vs tax over years
   - tax-position-details.component.ts/html/scss
     - Per-position breakdown
     - Teilfreistellung calculation shown
     - Vorabpauschale if applicable
   - tax-export.component.ts/html/scss
     - Export buttons: CSV, PDF
     - Preview before export

5. INTEGRATION:
   - Add tax page to main navigation (icon: receipt)
   - Add DataService methods
   - Add to interfaces and routes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT RULES:

- Follow existing NestJS patterns
- Use Prisma for all DB operations
- Write unit tests for calculation services (especially tax math!)
- Use environment variables for Telegram bot token
- Don't break existing functionality
- Commit each task separately:
  After TASK A: git add -A && git commit -m "feat: Add Telegram bot integration (Phase 3 - Task A)"
  After TASK B: git add -A && git commit -m "feat: Add German tax reporting (Phase 3 - Task B)"

NOTE: For the Telegram bot, create a placeholder/bot setup script that documents
how to register the bot with @BotFather. The bot should work with TELEGRAM_BOT_TOKEN
environment variable but don't hardcode any token.
