/**
 * Sert le sitemap en XML pour /sitemap.xml (rewrite Vercel).
 * GET /api/sitemap → Content-Type: application/xml
 */

import sitemap from '../app/sitemap';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }
  const entries = sitemap();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) =>
        `<url><loc>${escapeXml(e.url)}</loc>` +
        (e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString().split('T')[0]}</lastmod>` : '') +
        (e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : '') +
        (e.priority != null ? `<priority>${e.priority}</priority>` : '') +
        '</url>'
    ),
    '</urlset>',
  ].join('\n');

  res.status(200);
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.end(xml);
}
