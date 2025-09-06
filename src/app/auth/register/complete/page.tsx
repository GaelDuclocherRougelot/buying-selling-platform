'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

function CompleteRegistrationInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!token) {
      toast.error('Lien invalide.');
      return;
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      toast.success('Compte créé ! Vous pouvez vous connecter.');
      router.push('/auth/login');
    } catch {
      // error already handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='flex flex-col items-center justify-center min-h-screen p-4 lg:p-0'>
      <Card className='max-w-[30rem] w-full'>
        <CardHeader>
          <CardTitle className='text-lg md:text-2xl font-bold text-center'>
            Finaliser votre inscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='password'>Mot de passe</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='confirm'>Confirmer le mot de passe</Label>
              <Input
                id='confirm'
                type='password'
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <Button className='w-full' onClick={submit} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense>
      <CompleteRegistrationInner />
    </Suspense>
  );
}
