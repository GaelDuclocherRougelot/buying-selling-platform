# Sitemap System

This document explains how to use and maintain the sitemap system for the buying-selling platform.

## Files Created

1. **`public/sitemap.xml`** - Static sitemap file
2. **`scripts/generate-sitemap.ts`** - Dynamic sitemap generation script
3. **`public/robots.txt`** - Search engine crawling instructions
4. **`docs/SITEMAP_README.md`** - This documentation file

## Quick Start

### Generate Sitemap

```bash
# Generate sitemap with current date
pnpm run sitemap:generate

# Or run the script directly
tsx scripts/generate-sitemap.ts
```

### Environment Configuration

Set your domain in your `.env` file:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Sitemap Structure

The sitemap includes the following URL categories with appropriate priorities:

### High Priority (0.8-1.0)

- **Homepage** (`/`) - Priority 1.0, Daily updates
- **Products** (`/products`) - Priority 0.9, Daily updates
- **Search** (`/search`) - Priority 0.8, Daily updates
- **Categories** (`/categories`) - Priority 0.8, Weekly updates

### Medium Priority (0.5-0.7)

- **Profile** (`/profile`) - Priority 0.7, Weekly updates
- **Contact** (`/contact`) - Priority 0.6, Monthly updates
- **Authentication** (`/auth/*`) - Priority 0.5, Monthly updates

### Lower Priority (0.2-0.4)

- **Documentation** (`/docs`) - Priority 0.4, Monthly updates
- **Admin pages** (`/admin/*`) - Priority 0.2-0.3, Weekly updates
- **Legal pages** (`/legal/*`) - Priority 0.3, Yearly updates

## Update Frequencies

- **Daily**: Homepage, products, search
- **Weekly**: Categories, profile, admin pages
- **Monthly**: Contact, auth, documentation, API docs
- **Yearly**: Legal pages (privacy policy, terms, etc.)

## Customization

### Adding New URLs

Edit the `sitemapUrls` array in `scripts/generate-sitemap.ts`:

```typescript
{
  loc: '/new-page',
  lastmod: new Date().toISOString().split('T')[0],
  changefreq: 'weekly',
  priority: 0.6
}
```

### Modifying Priorities

Adjust the `priority` values based on your SEO strategy:

- **1.0**: Most important pages (homepage)
- **0.8-0.9**: High-value content pages
- **0.5-0.7**: Medium importance pages
- **0.2-0.4**: Lower priority pages

### Changing Update Frequencies

Modify the `changefreq` values:

- `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`

## Integration with Build Process

### Pre-build Generation

Add to your build script in `package.json`:

```json
{
  "scripts": {
    "prebuild": "pnpm run sitemap:generate",
    "build": "prisma generate && next build"
  }
}
```

### Automated Updates

Set up a cron job or GitHub Action to regenerate the sitemap:

```bash
# Daily at 2 AM
0 2 * * * cd /path/to/project && pnpm run sitemap:generate
```

## Search Engine Submission

### Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your sitemap: `https://yourdomain.com/sitemap.xml`
3. Monitor indexing status

### Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your sitemap: `https://yourdomain.com/sitemap.xml`

### Other Search Engines

- **Yandex**: Submit via [Yandex Webmaster](https://webmaster.yandex.com/)
- **DuckDuckGo**: Automatically discovers sitemaps
- **Baidu**: Submit via [Baidu Webmaster Tools](https://ziyuan.baidu.com/)

## Validation

### XML Validation

Validate your sitemap using online tools:

- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google's Sitemap Testing Tool](https://www.google.com/webmasters/tools/)

### Command Line Validation

```bash
# Check XML syntax
xmllint --noout public/sitemap.xml

# Validate against schema
xmllint --schema http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd public/sitemap.xml --noout
```

## Troubleshooting

### Common Issues

1. **Domain not set**: Ensure `NEXT_PUBLIC_SITE_URL` is set in your environment
2. **File permissions**: Ensure the script can write to the `public/` directory
3. **Invalid XML**: Check for special characters in URLs or descriptions

### Debug Mode

Run the script with verbose logging:

```bash
DEBUG=* tsx scripts/generate-sitemap.ts
```

## Best Practices

1. **Keep URLs clean**: Use descriptive, SEO-friendly URLs
2. **Regular updates**: Regenerate sitemap when adding new pages
3. **Monitor performance**: Check search console for indexing issues
4. **Respect robots.txt**: Ensure your sitemap doesn't conflict with crawling rules
5. **Size limits**: Keep sitemap under 50MB and 50,000 URLs (split if needed)

## Advanced Features

### Dynamic Sitemap Generation

For large sites, consider implementing dynamic sitemap generation:

```typescript
// Generate sitemap on-demand
export async function GET() {
  const sitemap = await generateDynamicSitemap();
  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

### Sitemap Index

For very large sites, create a sitemap index:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://yourdomain.com/sitemap-main.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://yourdomain.com/sitemap-products.xml</loc>
  </sitemap>
</sitemapindex>
```

## Support

For issues or questions about the sitemap system:

1. Check this documentation
2. Review the script logs
3. Validate XML syntax
4. Check search console for errors




