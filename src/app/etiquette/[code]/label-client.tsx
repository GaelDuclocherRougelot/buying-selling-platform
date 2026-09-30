'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LabelClientProps {
  code: string;
  deviceId: string;
  weightGrams: number;
  weighedAt: string;
  sellerName: string;
  linked: { id: string; productTitle: string; buyerName: string } | null;
  payments: { id: string; label: string }[];
}

export default function LabelClient({
  code,
  deviceId,
  weightGrams,
  weighedAt,
  sellerName,
  linked,
  payments,
}: LabelClientProps) {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState(
    linked?.id ?? payments[0]?.id ?? ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function link() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/iot/weighings/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? 'Erreur');
      return;
    }
    router.refresh();
  }

  return (
    <main className='container mx-auto max-w-xl px-4 py-8 space-y-6'>
      {/* N'imprime que l'étiquette, pas le header/footer du site */}
      <style>{`@media print {
				body * { visibility: hidden; }
				#etiquette, #etiquette * { visibility: visible; }
				#etiquette { position: absolute; left: 0; top: 0; }
			}`}</style>

      <h1 className='text-2xl font-bold'>Étiquette {code}</h1>

      <div className='space-y-2'>
        <label htmlFor='payment' className='text-sm font-medium'>
          Commande à rattacher
        </label>
        {payments.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Aucune vente à rattacher.
          </p>
        ) : (
          <div className='flex gap-2'>
            <select
              id='payment'
              className='flex-1 rounded-md border px-3 py-2 text-sm'
              value={paymentId}
              onChange={e => setPaymentId(e.target.value)}
            >
              {payments.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button onClick={link} disabled={saving || !paymentId}>
              {linked ? 'Changer' : 'Lier'}
            </Button>
          </div>
        )}
        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>

      <section
        id='etiquette'
        className='w-[100mm] border-2 border-black p-4 font-mono text-black bg-white space-y-2'
      >
        <div className='flex justify-between border-b-2 border-black pb-2'>
          <span className='text-xl font-bold'>ZONE</span>
          <span className='text-xl font-bold'>{code}</span>
        </div>
        <p className='text-4xl font-bold'>
          {(weightGrams / 1000).toFixed(3)} kg
        </p>
        <p>Expéditeur : {sellerName}</p>
        {linked ? (
          <>
            <p>Destinataire : {linked.buyerName}</p>
            <p>Produit : {linked.productTitle}</p>
            <p className='text-xs'>Commande : {linked.id}</p>
          </>
        ) : (
          <p className='italic'>Commande non rattachée</p>
        )}
        <p className='text-xs border-t border-black pt-2'>
          Pesé le {new Date(weighedAt).toLocaleString('fr-FR')} · {deviceId}
        </p>
      </section>

      <Button onClick={() => window.print()} disabled={!linked}>
        Imprimer l&apos;étiquette
      </Button>
    </main>
  );
}
