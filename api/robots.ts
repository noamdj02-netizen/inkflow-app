/**
 * Sert robots.txt pour /robots.txt (rewrite Vercel).
 * GET /api/robots → Content-Type: text/plain
 */

import robots from '../app/robots';

function buildRobotsTxt(config: ReturnType<typeof robots>): string {
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
  const config = robots();
  const txt = buildRobotsTxt(config);

  res.status(200);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.end(txt);
}
