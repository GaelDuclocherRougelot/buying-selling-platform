/*
  Warnings:

  - You are about to drop the column `weight` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "weight",
ADD COLUMN     "deliveryPrice" DOUBLE PRECISION;
