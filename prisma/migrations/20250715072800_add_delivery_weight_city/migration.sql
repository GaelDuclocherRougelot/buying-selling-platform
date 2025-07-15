-- AlterTable
ALTER TABLE "products" ADD COLUMN     "city" TEXT,
ADD COLUMN     "delivery" TEXT NOT NULL DEFAULT 'pickup',
ADD COLUMN     "weight" DOUBLE PRECISION;
