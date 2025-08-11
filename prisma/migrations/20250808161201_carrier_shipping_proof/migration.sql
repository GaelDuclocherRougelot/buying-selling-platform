-- AlterTable
ALTER TABLE "shipping_proof" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT;
