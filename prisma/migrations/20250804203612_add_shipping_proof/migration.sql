-- CreateTable
CREATE TABLE "shipping_proof" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "proofType" TEXT NOT NULL,
    "proofData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_verification',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_proof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_proof_paymentId_key" ON "shipping_proof"("paymentId");

-- AddForeignKey
ALTER TABLE "shipping_proof" ADD CONSTRAINT "shipping_proof_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
