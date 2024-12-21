/*
  Warnings:

  - You are about to drop the column `charge` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "charge",
ADD COLUMN     "amount" INTEGER NOT NULL;
