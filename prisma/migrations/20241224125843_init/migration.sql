/*
  Warnings:

  - You are about to drop the column `renewalDate` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "renewalDate",
ADD COLUMN     "isNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRenewalDate" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_authorId_idx" ON "Subscription"("authorId");
