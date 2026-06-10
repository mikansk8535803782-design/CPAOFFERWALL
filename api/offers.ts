// Vercel serverless function — GET /api/offers
// Proxies CPALead's publisher API (geo-filtered for India), normalises the
// shape and returns a JSON array to the browser. Click-out URLs include a
// {subid} placeholder so the frontend can swap in the user UUID.

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NormalizedOffer {
  id: string;
  title: string;
  description: string;
  payoutUsd: number;
  payoutInr: number;
  rewardPoints: number;
  countries: string[];
  devices: string[];
  category: string;
  icon: string;
  network: 'cpalead';
  /** URL with literal `{subid}` placeholder — frontend swaps in user UUID. */
  clickUrl: string;
}

const USD_TO_INR_FALLBACK = 83;
const PAYOUT_RATIO_FALLBACK = 0.7;
const POINTS_PER_RUPEE = 20; // matches systemSettings.ptsToCashRate

function pickIcon(category: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('app') || c.includes('install')) return '📱';
  if (c.includes('survey')) return '📋';
  if (c.includes('game')) return '🎮';
  if (c.includes('finance') || c.includes('bank')) return '💳';
  if (c.includes('shop') || c.includes('ecom')) return '🛍️';
  if (c.includes('crypto')) return '🪙';
  return '🌐';
}

function normalize(raw: any): NormalizedOffer | null {
  if (!raw || typeof raw !== 'object') return null;

  // Payout in USD comes back as `amount` (string or number).
  const usd = parseFloat(String(raw.amount ?? '0')) || 0;
  if (usd <= 0) return null;

  const ratio = PAYOUT_RATIO_FALLBACK;
  const usdInr = USD_TO_INR_FALLBACK;
  const payoutInr = +(usd * usdInr * ratio).toFixed(2);
  const rewardPoints = Math.round(payoutInr * POINTS_PER_RUPEE);

  // Click URL: `link`, with a fallback to creatives[0].link.
  let click: string = raw.link ?? raw.creatives?.[0]?.link ?? '';
  if (!click) return null;
  click = click.includes('subid=')
    ? click.replace(/subid=[^&]*/i, 'subid={subid}')
    : (click.includes('?') ? `${click}&subid={subid}` : `${click}?subid={subid}`);

  const countries: string[] = Array.isArray(raw.countries) ? raw.countries : [];

  // `device` in CPALead is one of: "iphone_ipad", "android", "desktop", "all"
  const devices: string[] = raw.device
    ? (Array.isArray(raw.device) ? raw.device : [String(raw.device)])
    : [];

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? 'CPA Offer').slice(0, 120),
    description: String(raw.description ?? raw.long_description ?? '').slice(0, 240),
    payoutUsd: +usd.toFixed(2),
    payoutInr,
    rewardPoints,
    countries,
    devices,
    category: '',
    icon: pickIcon(String(raw.title ?? '')),
    network: 'cpalead',
    clickUrl: click,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pubIdRaw = process.env.CPALEAD_PUBLISHER_ID || process.env.VITE_CPALEAD_PUBLISHER_ID;
  if (!pubIdRaw) {
    return res.status(200).json({ offers: [], error: 'CPALEAD_PUBLISHER_ID is not configured.' });
  }
  // CPALead requires `id` to be an integer — strip any whitespace/quotes.
  const pubId = String(pubIdRaw).trim().replace(/['"]/g, '');
  if (!/^\d+$/.test(pubId)) {
    return res.status(200).json({
      offers: [],
      error: `CPALEAD_PUBLISHER_ID must be numeric (got: "${pubId}").`,
    });
  }

  const country = (req.query.country as string)?.toUpperCase()
    || (req.query.geo as string)?.toUpperCase()
    || 'IN';
  // CPALead device values: iphone_ipad | android | desktop | all
  const device = (req.query.device as string) || 'all';
  const limit = Math.min(parseInt((req.query.limit as string) ?? '40', 10) || 40, 100);

  // CPALead Publisher API — https://www.cpalead.com/en/api
  // Use only allowed field names; `id` is the publisher id (integer).
  const url =
    `https://www.cpalead.com/api/offers` +
    `?id=${pubId}` +
    `&country=${encodeURIComponent(country)}` +
    `&device=${encodeURIComponent(device)}` +
    `&limit=${limit}` +
    `&fields=id,title,description,long_description,conversion,device,link,amount,payout_currency,payout_type,countries,creatives,offer_rank`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'earnhub-vercel/1.0', Accept: 'application/json' },
    });
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      return res.status(200).json({
        offers: [],
        error: `CPALead returned HTTP ${upstream.status}`,
        upstreamHint: body.slice(0, 240),
      });
    }
    const data = await upstream.json();

    // CPALead returns either {offers:[...]} or a bare array; tolerate both.
    const rawList: any[] = Array.isArray(data) ? data : (data?.offers ?? data?.data ?? []);
    const offers = rawList
      .map(normalize)
      .filter((o): o is NormalizedOffer => o !== null)
      .slice(0, limit);

    res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600');
    return res.status(200).json({ offers, country, fetchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('CPALead offers fetch failed:', err);
    return res.status(200).json({ offers: [], error: err?.message || 'fetch failed' });
  }
}
