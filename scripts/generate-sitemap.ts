#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
}

interface SitemapConfig {
  domain: string;
  outputPath: string;
}

const config: SitemapConfig = {
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
  outputPath: path.join(process.cwd(), 'public', 'sitemap.xml'),
};

const sitemapUrls: SitemapUrl[] = [
  // Homepage
  {
    loc: '/',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  },

  // Main Pages
  {
    loc: '/search',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  },

  {
    loc: '/contact',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.6,
  },

  // Categories
  {
    loc: '/categories',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  },

  // Products
  {
    loc: '/products',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9,
  },

  // Legal Pages
  {
    loc: '/legal/politique-de-confidentialite',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3,
  },

  {
    loc: '/legal/mentions-legales',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3,
  },

  {
    loc: '/legal/cgv',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3,
  },

  {
    loc: '/legal/cgu',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'yearly',
    priority: 0.3,
  },

  // Auth Pages
  {
    loc: '/auth/signin',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.5,
  },

  {
    loc: '/auth/signup',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.5,
  },

  // Profile Pages
  {
    loc: '/profile',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7,
  },

  // Admin Pages (Lower priority as they're not public)
  {
    loc: '/admin',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/products',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/categories',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/users',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/shipping-proofs',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/error-logs',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/login-logs',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.2,
  },

  {
    loc: '/admin/api-doc',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.3,
  },

  // Documentation
  {
    loc: '/docs',
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.4,
  },
];

function generateSitemapXml(urls: SitemapUrl[], domain: string): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetStart =
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetEnd = '</urlset>';

  const urlElements = urls
    .map(url => {
      return `  <url>
    <loc>${domain}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `${xmlHeader}
${urlsetStart}
${urlElements}
${urlsetEnd}`;
}

function generateSitemap(): void {
  try {
    console.log('🚀 Generating sitemap...');
    console.log(`📍 Domain: ${config.domain}`);
    console.log(`📁 Output path: ${config.outputPath}`);

    const sitemapXml = generateSitemapXml(sitemapUrls, config.domain);

    // Ensure the public directory exists
    const publicDir = path.dirname(config.outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write the sitemap file
    fs.writeFileSync(config.outputPath, sitemapXml, 'utf8');

    console.log(`✅ Sitemap generated successfully at ${config.outputPath}`);
    console.log(`📊 Total URLs: ${sitemapUrls.length}`);

    // Log some stats
    const priorities = sitemapUrls.reduce(
      (acc, url) => {
        acc[url.priority] = (acc[url.priority] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    console.log('📈 Priority distribution:');
    Object.entries(priorities).forEach(([priority, count]) => {
      console.log(`   Priority ${priority}: ${count} URLs`);
    });
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  generateSitemap();
}

export {
  SitemapConfig,
  SitemapUrl,
  generateSitemap,
  generateSitemapXml,
  sitemapUrls,
};




