import { auth } from '@/lib/auth';
import { decryptJson } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { token, password } = bodySchema.parse(json);

    const verification = await prisma.verification.findUnique({
      where: { id: token },
    });
    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    const { email, username, name, image, role } = decryptJson<{
      email: string;
      username: string;
      name: string;
      image: string;
      role: string;
    }>(verification.value);

    // If a user already exists (race/previous completion), short-circuit
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: true });
    }

    // Use Better Auth API to create the user with email/password
    // Note: This calls the internal sign-up endpoint via the server instance
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username,
        displayUsername: username,
        role: 'user',
        stripeAccountId: '',
        stripeAccountStatus: '',
      },
    });

    // Mark the email as verified explicitly
    const created = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        ...(image ? { image } : {}),
        ...(role ? { role } : {}),
        displayUsername: username,
      },
    });

    // Delete the token to prevent reuse
    await prisma.verification.delete({ where: { id: token } });

    return NextResponse.json({ ok: true, userId: created.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('complete-signup error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
