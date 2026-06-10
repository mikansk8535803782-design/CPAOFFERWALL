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

  // CPALead's payout can come as "amount" (string) or "payout" — handle both.
  const usd = parseFloat(raw.amount ?? raw.payout ?? '0') || 0;
  if (usd <= 0) return null;

  const ratio = PAYOUT_RATIO_FALLBACK;
  const usdInr = USD_TO_INR_FALLBACK;
  const payoutInr = +(usd * usdInr * ratio).toFixed(2);
  const rewardPoints = Math.round(payoutInr * POINTS_PER_RUPEE);

  // Click URL: CPALead returns the tracking link in `link` or `creatives[0].link`.
  let click: string = raw.link ?? raw.creatives?.[0]?.link ?? '';
  if (!click) return null;
  // Add or replace subid param with the literal token `{subid}`.
  click = click.includes('subid=')
    ? click.replace(/subid=[^&]*/i, 'subid={subid}')
    : (click.includes('?') ? `${click}&subid={subid}` : `${click}?subid={subid}`);

  const countries: string[] = Array.isArray(raw.countries)
    ? raw.countries
    : (raw.country ? [raw.country] : []);

  const devices: string[] = Array.isArray(raw.os)
    ? raw.os
    : (raw.os ? [raw.os] : (raw.device ? [raw.device] : []));

  return {
    id: String(raw.campid ?? raw.id ?? raw.offerid ?? ''),
    title: String(raw.title ?? raw.name ?? 'CPA Offer').slice(0, 120),
    description: String(raw.description ?? raw.short_description ?? '').slice(0, 240),
    payoutUsd: +usd.toFixed(2),
    payoutInr,
    rewardPoints,
    countries,
    devices,
    category: String(raw.category ?? 'general'),
    icon: pickIcon(raw.category ?? ''),
    network: 'cpalead',
    clickUrl: click,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pubId = process.env.CPALEAD_PUBLISHER_ID || process.env.VITE_CPALEAD_PUBLISHER_ID;
  if (!pubId) {
    return res.status(200).json({ offers: [], error: 'CPALEAD_PUBLISHER_ID is not configured.' });
  }

  const country = (req.query.country as string)?.toUpperCase()
    || (req.query.geo as string)?.toUpperCase()
    || 'IN';
  const device = (req.query.device as string) || 'android,ios';
  const limit = Math.min(parseInt((req.query.limit as string) ?? '40', 10) || 40, 100);

  // Build CPALead Publisher API request — see https://www.cpalead.com/en/api
  // Required: id. Supported: country (ISO2 or 'user'), device, limit, fields, format.
  const url =
    `https://www.cpalead.com/api/offers` +
    `?id=${encodeURIComponent(pubId)}` +
    `&format=json` +
    `&country=${encodeURIComponent(country)}` +
    `&device=${encodeURIComponent(device)}` +
    `&limit=${limit}` +
    `&fields=id,title,description,short_description,link,amount,payout,country,countries,os,device,category,creatives,offer_rank,campid`;

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
