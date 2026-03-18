-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "color" TEXT,
ADD COLUMN     "targetAllocation" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "SavingsPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isin" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "accountId" TEXT,
    "accountUserId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsPlan_userId_idx" ON "SavingsPlan"("userId");

-- CreateIndex
CREATE INDEX "SavingsPlan_isin_idx" ON "SavingsPlan"("isin");

-- CreateIndex
CREATE INDEX "SavingsPlan_isActive_idx" ON "SavingsPlan"("isActive");

-- AddForeignKey
ALTER TABLE "SavingsPlan" ADD CONSTRAINT "SavingsPlan_accountId_accountUserId_fkey" FOREIGN KEY ("accountId", "accountUserId") REFERENCES "Account"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsPlan" ADD CONSTRAINT "SavingsPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
