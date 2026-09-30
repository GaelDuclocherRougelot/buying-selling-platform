import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rattache une pesée à une commande du vendeur connecté.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { code } = await params;
  const body = await request.json().catch(() => null);
  const paymentId = body?.paymentId;
  if (typeof paymentId !== 'string') {
    return NextResponse.json({ error: 'paymentId requis' }, { status: 400 });
  }

  const weighing = await prisma.weighing.findUnique({
    where: { code: code.toUpperCase() },
    include: { payment: true },
  });
  if (!weighing) {
    return NextResponse.json({ error: 'Pesée non trouvée' }, { status: 404 });
  }
  if (weighing.payment && weighing.payment.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: 'Pesée déjà liée à une autre commande' },
      { status: 403 }
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment || payment.sellerId !== session.user.id) {
    return NextResponse.json(
      { error: 'Seul le vendeur de la commande peut lier une pesée' },
      { status: 403 }
    );
  }

  const updated = await prisma.weighing.update({
    where: { id: weighing.id },
    data: { paymentId },
  });
  return NextResponse.json({ weighing: updated });
}
