You are continuing the implementation of a custom Ghostfolio fork for a German investor named Lux.

PROJECT CONTEXT:

- This is a fork of Ghostfolio (NestJS + Angular + Prisma + PostgreSQL)
- Phase 1 is complete: Trade Republic CSV Import + Custom Allocation View
- Read PLAN.md for full architecture details and feature descriptions

CURRENT BRANCH: Start from feature/phase1-tr-import-and-allocations, create feature/phase2-savings-and-dividends

YOUR TASK: Implement Phase 2 — Savings Plan Tracking + Enhanced Dividend Dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK A: SAVINGS PLAN TRACKING (44h estimated)

Build a complete savings plan management system.

1. DATABASE - Add to prisma/schema.prisma:

```
model SavingsPlan {
  id              String   @id @default(uuid())
  name            String
  isin            String?
  symbol          String?
  amount          Float
  interval        String   @default("MONTHLY")
  dayOfMonth      Int      @default(1)
  category        String?  // Gold, Dividend, Spec, Russia, Growth
  isActive        Boolean  @default(true)
  startDate       DateTime @default(now())
  endDate         DateTime?
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  accountId       String?
  account         Account? @relation(fields: [accountId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, isin, interval])
}
```

Run: npx prisma format

2. BACKEND - Create /apps/api/src/app/savings-plan/:
   - savings-plan.controller.ts
     - GET /api/savings-plan — List all plans for user
     - POST /api/savings-plan — Create plan
     - PUT /api/savings-plan/:id — Update plan (amount, active, etc.)
     - DELETE /api/savings-plan/:id — Delete plan
     - GET /api/savings-plan/summary — Monthly summary (total, per category)
     - GET /api/savings-plan/history — Rate change history
   - savings-plan.service.ts
     - CRUD operations
     - Calculate monthly total
     - Group by category
     - Track rate adjustments (save history on amount changes)
     - Impact on dividend projections
   - savings-plan.module.ts
   - savings-plan.dto.ts (with class-validator decorators)

3. FRONTEND - Create /apps/client/src/app/pages/savings-plans/:
   - savings-plans-page.component.ts/html/scss
     - Overview table: Plan name, ISIN, amount, interval, category, status
     - Summary card: Total monthly investment, per category breakdown
     - Add/Edit plan dialog
   - savings-plan-card.component.ts/html/scss
     - Individual plan card with key info
   - savings-plan-summary.component.ts/html/scss
     - Monthly total, category pie chart, trend

4. INTEGRATION:
   - Add savings plans route to main navigation
   - Add DataService methods for API calls
   - Add to /libs/common/src/lib/interfaces/ and routes.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK B: ENHANCED DIVIDEND DASHBOARD (34h estimated)

Build a dedicated dividend tracking dashboard.

1. DATABASE - Add to prisma/schema.prisma:

```
model DividendGoal {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  monthlyTarget Float  @default(3000)
  targetDate  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. BACKEND - Create /apps/api/src/app/dividend/:
   - dividend.controller.ts
     - GET /api/dividend/dashboard — Full dashboard data
     - GET /api/dividend/calendar — Upcoming dividend payments (next 30/90 days)
     - GET /api/dividend/projections — Forward dividend income projection
     - GET /api/dividend/goals — Goal progress (current vs 3000 EUR/month target)
     - PUT /api/dividend/goals — Update dividend goals
   - dividend.service.ts
     - Aggregate dividend data from Order/Activity table (type = DIVIDEND)
     - Group by month, by position, by year
     - Calculate trailing 12-month dividend income
     - Forward yield projection based on current holdings
     - Monthly income trend over time
   - dividend.module.ts
   - dividend.dto.ts

3. FRONTEND - Create /apps/client/src/app/pages/dividend/:
   - dividend-page.component.ts/html/scss (main dashboard)
     - Current monthly dividend income (trailing 12mo average)
     - Dividend yield: per position and overall portfolio
     - Monthly income trend chart (line chart, last 24 months)
   - dividend-calendar.component.ts/html/scss
     - Calendar view showing upcoming dividend dates
     - Heatmap style (green = payment day, intensity = amount)
   - dividend-projection.component.ts/html/scss
     - Forward 12-month projected income
     - Growth trajectory toward goal
   - dividend-goal-tracker.component.ts/html/scss
     - Progress bar: current monthly income → 3,000 EUR/month goal
     - Percentage to goal
     - Estimated years to goal based on growth rate
   - dividend-summary.component.ts/html/scss
     - Annual summary table
     - Top dividend payers
     - Yield comparison by category

4. INTEGRATION:
   - Add dividend dashboard to main navigation (icon: payments)
   - Add DataService methods
   - Add to interfaces and routes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT RULES:

- Follow existing NestJS patterns (look at how other modules are structured)
- Use Prisma for all DB operations
- Write unit tests for all services (Jest)
- Use TypeScript strict types
- Don't break existing functionality
- Commit each task separately:
  After TASK A: git add -A && git commit -m "feat: Add savings plan tracking (Phase 2 - Task A)"
  After TASK B: git add -A && git commit -m "feat: Add enhanced dividend dashboard (Phase 2 - Task B)"
