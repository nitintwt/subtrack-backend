-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'nan';
