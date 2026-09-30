import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Sans 0/O/1/I pour éviter les confusions à la lecture sur l'écran de la balance
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  return Array.from(
    { length: 4 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  ).join('');
}

/**
 * Reçoit une pesée depuis la balance connectée et renvoie un code court
 * que le vendeur saisit sur /etiquette/[code].
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.IOT_DEVICE_SECRET;
  if (
    !expectedSecret ||
    request.headers.get('authorization') !== `Bearer ${expectedSecret}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const deviceId = body?.deviceId;
  const weightGrams = body?.weightGrams;
  if (
    typeof deviceId !== 'string' ||
    deviceId.length === 0 ||
    deviceId.length > 64 ||
    !Number.isInteger(weightGrams) ||
    weightGrams < 1 ||
    weightGrams > 30000
  ) {
    return NextResponse.json(
      { error: 'deviceId ou weightGrams (1-30000) invalide' },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const weighing = await prisma.weighing.create({
        data: { code: generateCode(), deviceId, weightGrams },
      });
      return NextResponse.json({ code: weighing.code }, { status: 201 });
    } catch (error) {
      // Code déjà pris : on retente avec un autre
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        continue;
      }
      console.error('❌ Erreur pesée IoT:', error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la pesée" },
        { status: 500 }
      );
    }
  }
  return NextResponse.json(
    { error: 'Impossible de générer un code' },
    { status: 503 }
  );
}
