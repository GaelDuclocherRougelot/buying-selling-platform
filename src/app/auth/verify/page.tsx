'use client';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <main className='flex flex-col items-center justify-center min-h-screen p-4 lg:p-0'>
      <Card className='max-w-[30rem] w-full'>
        <CardHeader>
          <CardTitle>Important : Vérifiez votre adresse e-mail</CardTitle>
          {email ? (
            <CardDescription>
              Nous avons envoyé un lien de vérification à {email}.
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
