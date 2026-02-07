/**
 * Route unifiée robots + sitemap (≤12 functions Vercel Hobby).
 * Rewrites: /api/robots, /api/sitemap, /robots.txt, /sitemap.xml → /api/static?path=robots|sitemap
 */

import robotsConfig from '../app/robots';
import sitemapConfig from '../app/sitemap';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRobotsTxt(config: ReturnType<typeof robotsConfig>): string {
  const lines: string[] = [];
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  for (const rule of rules) {
    const ua = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
    for (const agent of ua) {
      lines.push(`User-agent: ${agent}`);
      if (rule.allow) {
        const allow = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
        allow.forEach((a) => lines.push(`Allow: ${a}`));
      }
      if (rule.disallow) {
        const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
        disallow.forEach((d) => lines.push(`Disallow: ${d}`));
      }
    }
  }
  if (config.host) lines.push(`Host: ${config.host}`);
  if (config.sitemap) {
    const sitemaps = Array.isArray(config.sitemap) ? config.sitemap : [config.sitemap];
    sitemaps.forEach((s) => lines.push(`Sitemap: ${s}`));
  }
  return lines.join('\n');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }
  const path = (req.query?.path as string) || (req.url?.includes('sitemap') ? 'sitemap' : 'robots');

  if (path === 'robots') {
    const config = robotsConfig();
    const txt = buildRobotsTxt(config);
    res.status(200);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.end(txt);
    return;
  }

  if (path === 'sitemap') {
    const entries = sitemapConfig();
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
    return;
  }

  res.status(400).end('Invalid path. Use ?path=robots|sitemap');
}
