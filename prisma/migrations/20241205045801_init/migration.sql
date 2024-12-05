-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "charge" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "renewalDate" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
