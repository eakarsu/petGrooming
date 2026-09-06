-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "refundedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCents" INTEGER,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GiftCard" ADD COLUMN     "balanceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "initialCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "taxConfigured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PetOperation" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetBalanceEntry" (
    "id" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetBalanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetOperation_actorId_createdAt_idx" ON "PetOperation"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "PetBalanceEntry_accountType_accountId_createdAt_idx" ON "PetBalanceEntry"("accountType", "accountId", "createdAt");

-- CreateIndex
CREATE INDEX "PetAudit_entityId_createdAt_idx" ON "PetAudit"("entityId", "createdAt");


UPDATE "GiftCard" SET "balanceCents"=ROUND("currentBalance"::numeric*100)::integer,"initialCents"=ROUND("initialBalance"::numeric*100)::integer;
ALTER TABLE "GiftCard" ADD CONSTRAINT "gift_balance_nonnegative" CHECK ("balanceCents">=0 AND "initialCents">=0);
ALTER TABLE "Transaction" ADD CONSTRAINT "verified_total_nonnegative" CHECK ("totalCents" IS NULL OR ("totalCents">=0 AND "refundedCents">=0 AND "refundedCents"<="totalCents"));
