'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  GA_TRACKING_ID?: string;
  nonce?: string;
}

const GoogleAnalytics = ({ GA_TRACKING_ID, nonce }: GoogleAnalyticsProps) => {
  // Don't render in development unless explicitly set
  if (!GA_TRACKING_ID || process.env.NODE_ENV === 'development') {
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
