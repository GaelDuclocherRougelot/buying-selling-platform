import { getBaseURL } from '@/lib/api';
import { encryptJson } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  name: z.string().min(1),
  image: z.string().optional().nullable(),
  role: z.string().optional().default('user'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email, username, name, image, role } = bodySchema.parse(json);

    // Prevent duplicates if a verified user already exists
    const existingVerified = await prisma.user.findUnique({ where: { email } });
    if (existingVerified) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create a short-lived verification token in Better Auth's Verification table
    // We'll store only a minimal encrypted payload in value
    const payload = { email, username, name, image, role };
    const encrypted = encryptJson(payload);
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.verification.create({
      data: {
        id: tokenId,
        identifier: 'pending-signup',
        value: encrypted,
        expiresAt,
        createdAt: new Date(),
      },
    });

    const appUrl = getBaseURL();
    const url = `${appUrl}/auth/register/complete?token=${encodeURIComponent(
      tokenId
    )}`;

    await resend.emails.send({
      from: 'ZONE <noreply@noreply.gael-dr.fr>',
      to: [email],
      subject: 'Vérifiez votre adresse email',
      text: `Merci de vérifier votre adresse email pour finaliser votre inscription: ${url}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('pending-signup error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
