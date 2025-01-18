/*
  Warnings:

  - Added the required column `category` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "category" TEXT NOT NULL;
