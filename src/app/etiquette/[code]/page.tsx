import { getUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LabelClient from './label-client';

export const metadata: Metadata = {
  title: 'Étiquette de colis',
  robots: { index: false },
};

/**
 * Étiquette générée à partir d'une pesée de la balance connectée.
 */
export default async function LabelPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const { code } = await params;
  const weighing = await prisma.weighing.findUnique({
    where: { code: code.toUpperCase() },
    include: { payment: { include: { product: true, buyer: true } } },
  });
  if (!weighing) notFound();
  if (weighing.payment && weighing.payment.sellerId !== user.id) notFound();

  const payments = await prisma.payment.findMany({
    where: { sellerId: user.id },
    include: { product: true, buyer: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <LabelClient
      code={weighing.code}
      deviceId={weighing.deviceId}
      weightGrams={weighing.weightGrams}
      weighedAt={weighing.createdAt.toISOString()}
      sellerName={user.name}
      linked={
        weighing.payment && {
          id: weighing.payment.id,
          productTitle: weighing.payment.product.title,
          buyerName: weighing.payment.buyer.name,
        }
      }
      payments={payments.map(p => ({
        id: p.id,
        label: `${p.product.title} — ${p.buyer.name} (${p.createdAt.toLocaleDateString('fr-FR')})`,
      }))}
    />
  );
}
