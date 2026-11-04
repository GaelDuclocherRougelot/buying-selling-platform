'use client';

import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from '@/lib/consent';
import Script from 'next/script';
import { useEffect, useState } from 'react';

interface GoogleAnalyticsProps {
  GA_TRACKING_ID?: string;
  nonce?: string;
}

type GAWindow = Window & Record<string, unknown>;

/** Supprime les cookies GA (_ga, _ga_XXXX, _gid) après un retrait du consentement. */
function deleteGaCookies() {
  const host = window.location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  document.cookie
    .split(';')
    .map(c => c.split('=')[0].trim())
    .filter(name => name.startsWith('_ga') || name === '_gid')
    .forEach(name => {
      domains.forEach(domain => {
        document.cookie = `${name}=; Path=/; Max-Age=0${domain ? `; Domain=${domain}` : ''}`;
      });
    });
}

/**
 * Google Analytics, chargé uniquement après consentement "analytics" (CNIL).
 */
const GoogleAnalytics = ({ GA_TRACKING_ID, nonce }: GoogleAnalyticsProps) => {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasAnalyticsConsent());
    const onChange = () => setConsent(hasAnalyticsConsent());
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!GA_TRACKING_ID) return;
    // Désactive GA si le consentement est retiré après chargement
    (window as unknown as GAWindow)[`ga-disable-${GA_TRACKING_ID}`] = !consent;
    if (!consent) deleteGaCookies();
  }, [consent, GA_TRACKING_ID]);

  // Don't render in development unless explicitly set
  if (!GA_TRACKING_ID || process.env.NODE_ENV === 'development' || !consent) {
    return null;
  }

  return (
    <>
      <Script
        strategy='afterInteractive'
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        nonce={nonce}
      />
      <Script
        id='gtag-init'
        strategy='afterInteractive'
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
