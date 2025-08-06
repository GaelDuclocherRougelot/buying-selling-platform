/*
  Warnings:

  - You are about to drop the `_PaymentToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PaymentToUser" DROP CONSTRAINT "_PaymentToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentToUser" DROP CONSTRAINT "_PaymentToUser_B_fkey";

-- DropTable
DROP TABLE "_PaymentToUser";

-- CreateTable
CREATE TABLE "shipment_tracking" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "carrier" TEXT NOT NULL DEFAULT 'colissimo',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastEventCode" TEXT,
    "lastEventLabel" TEXT,
    "lastEventDate" TIMESTAMP(3),
    "estimatedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "timeline" JSONB,
    "events" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipment_tracking_paymentId_key" ON "shipment_tracking"("paymentId");

-- AddForeignKey
ALTER TABLE "shipment_tracking" ADD CONSTRAINT "shipment_tracking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
