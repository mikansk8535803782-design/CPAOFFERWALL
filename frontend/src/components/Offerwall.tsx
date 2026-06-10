/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Globe, RefreshCw, ExternalLink, Smartphone, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Target } from 'lucide-react';

interface CpaOffer {
  id: string;
  title: string;
  description: string;
  conversion: string;
  payoutUsd: number;
  payoutInr: number;
  rewardPoints: number;
  countries: string[];
  devices: string[];
  category: string;
  icon: string;
  network: string;
  clickUrl: string;
}

interface OfferwallProps {
  userId?: string;
}

// Optional CPALead iframe widget URL configured via env. Should contain `{subid}`
// placeholder which will be replaced with the user's UUID at runtime.
const WIDGET_URL: string = (import.meta as any).env?.VITE_CPALEAD_WIDGET_URL || '';

export default function Offerwall({ userId }: OfferwallProps) {
  const [offers, setOffers] = useState<CpaOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // When iframe widget is configured, skip the API fetch entirely.
  const useWidget = !!WIDGET_URL;

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/offers?country=IN');
      const data = await res.json();
      if (data.error) setError(data.error);
      setOffers(Array.isArray(data.offers) ? data.offers : []);
      setRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load offers.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (useWidget) {
      setLoading(false);
      return;
    }
    fetchOffers();
  }, [useWidget]);

  const handleStartOffer = (offer: CpaOffer) => {
    if (!userId) {
      alert('Please sign in to start an offer.');
      return;
    }
    setOpeningId(offer.id);
    const url = offer.clickUrl.replace('{subid}', encodeURIComponent(userId));
    window.open(url, '_blank', 'noopener,noreferrer');
    // Reset the spinner shortly after opening
    setTimeout(() => setOpeningId(null), 1200);
  };

  const totalLive = offers.length;
  const minPayout = offers.length ? Math.min(...offers.map(o => o.payoutInr)) : 0;
  const maxPayout = offers.length ? Math.max(...offers.map(o => o.payoutInr)) : 0;

  // Compute the iframe src with {subid} replaced
  const iframeSrc = useWidget
    ? WIDGET_URL.replace('{subid}', encodeURIComponent(userId || 'guest'))
    : '';

  return (
    <div className="fadeIn space-y-6" data-testid="offerwall-root">
      {/* Header / Status */}
      <div className="bg-[#1a1a24] border border-[#7c6cff]/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c6cff]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#a594ff]" />
            Premium Tasks · India
          </h3>
          <p className="text-xs text-[#9191a8]">
            Complete the tasks below and your reward will be credited automatically once verified.
          </p>
        </div>
        {!useWidget && (
          <div className="flex gap-3 items-center shrink-0 relative z-10">
            <div className="text-center bg-[#16161f] border border-white/5 py-2 px-4 rounded-xl min-w-[78px]">
              <div className="font-display font-bold text-sm text-[#a594ff]" data-testid="offerwall-live-count">
                {loading ? '…' : totalLive}
              </div>
              <div className="text-[10px] text-[#5a5a72]">Live offers</div>
            </div>
            <div className="text-center bg-[#16161f] border border-white/5 py-2 px-4 rounded-xl min-w-[86px]">
              <div className="font-display font-bold text-sm text-[#3ecf8e]">
                ₹{minPayout.toFixed(0)}–{maxPayout.toFixed(0)}
              </div>
              <div className="text-[10px] text-[#5a5a72]">Payout range</div>
            </div>
            <button
              data-testid="offerwall-refresh-btn"
              onClick={fetchOffers}
              disabled={loading}
              className="bg-[#7c6cff] hover:bg-[#6a5aef] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all"
              aria-label="Refresh offers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Status strip — only shown for API mode */}
      {!useWidget && (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9191a8]">
          {refreshedAt && (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3ecf8e]" />
              Synced at {refreshedAt}
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1.5 text-[#ff4f4f]" data-testid="offerwall-error">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
        </div>
      )}

      {/* Iframe widget mode — load CPALead widget directly inside the app */}
      {useWidget && (
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl overflow-hidden" data-testid="offerwall-widget">
          <iframe
            src={iframeSrc}
            title="Premium Tasks"
            className="w-full"
            style={{ height: '720px', border: 0, background: '#0a0a0f' }}
            allow="clipboard-read; clipboard-write; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {/* API mode — list rendering */}
      {!useWidget && (
        <>
          {/* Loading skeleton */}
          {loading && offers.length === 0 && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-[#1a1a24] border border-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && offers.length === 0 && !error && (
            <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-10 text-center space-y-2">
              <Globe className="w-8 h-8 text-[#5a5a72] mx-auto" />
              <p className="text-sm text-white font-semibold">No active offers right now</p>
              <p className="text-xs text-[#9191a8]">Please check back in a few minutes — fresh offers are added constantly.</p>
            </div>
          )}

          {/* Offer cards */}
          {offers.length > 0 && (
            <ul className="space-y-3" data-testid="offerwall-list">
              {offers.map(o => {
                const isOpen = expandedId === o.id;
                const hasDetails = !!(o.conversion || (o.description && o.description.length > 80));
                return (
                  <li
                    key={o.id}
                    data-testid={`offerwall-item-${o.id}`}
                    className="bg-[#1a1a24] border border-white/7 rounded-2xl transition-all hover:border-[#7c6cff]/30 overflow-hidden"
                  >
                    {/* Top row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#16161f] flex items-center justify-center text-2xl shrink-0 border border-white/5">
                          {o.icon}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#f0f0f8] font-display truncate">{o.title}</h4>
                          {o.description && (
                            <p className={`text-xs text-[#9191a8] leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                              {o.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {o.devices.length > 0 && (
                              <span className="bg-[#5aedcc]/12 text-[#5aedcc] border border-[#5aedcc]/20 rounded-full px-2 py-0.5 text-[10px] font-medium inline-flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                {o.devices.slice(0, 2).join(' · ')}
                              </span>
                            )}
                            {o.countries.length > 0 && (
                              <span className="bg-white/[0.04] text-[#9191a8] border border-white/5 rounded-full px-2 py-0.5 text-[10px]">
                                {o.countries.slice(0, 3).join(' · ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[#a594ff] font-bold text-lg block font-display">
                            +{o.rewardPoints}
                          </span>
                          <span className="text-[10px] text-[#5a5a72] block">
                            coins (₹{o.payoutInr.toFixed(2)})
                          </span>
                        </div>

                        <button
                          data-testid={`btn-offer-${o.id}`}
                          onClick={() => handleStartOffer(o)}
                          disabled={openingId === o.id || !userId}
                          className="bg-[#7c6cff] hover:bg-[#6a5aef] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all font-display inline-flex items-center gap-1.5"
                        >
                          {openingId === o.id ? 'Opening…' : (<>
                            Start <ExternalLink className="w-3 h-3" />
                          </>)}
                        </button>
                      </div>
                    </div>

                    {/* Requirements toggle */}
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : o.id)}
                        data-testid={`offer-details-toggle-${o.id}`}
                        className="w-full px-5 py-2.5 border-t border-white/5 bg-[#0f0f17] hover:bg-[#13131c] flex items-center justify-between text-[11px] text-[#a594ff] font-semibold transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {isOpen ? 'Hide requirements' : 'View requirements & how to complete'}
                        </span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Expanded requirements */}
                    {isOpen && hasDetails && (
                      <div className="px-5 py-4 bg-[#0c0c14] border-t border-white/5 space-y-3">
                        {o.conversion && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-[#3ecf8e]">
                              ✅ What you need to do
                            </div>
                            <p className="text-xs text-[#f0f0f8] leading-relaxed bg-[#3ecf8e]/8 border border-[#3ecf8e]/20 rounded-lg px-3 py-2.5">
                              {o.conversion}
                            </p>
                          </div>
                        )}
                        {o.description && o.description.length > 80 && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-[#a594ff]">
                              📖 Full details
                            </div>
                            <p className="text-xs text-[#dcdce6] leading-relaxed whitespace-pre-wrap">
                              {o.description}
                            </p>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[11px] text-[#ffa94d] bg-[#ffa94d]/8 border border-[#ffa94d]/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>Complete the task fully on the partner site. Rewards credit automatically once the conversion is verified (usually within minutes).</span>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Footnote */}
      <p className="text-[11px] text-[#5a5a72] text-center pt-2">
        Rewards are credited automatically after the offer is verified. No manual claim is required.
      </p>
    </div>
  );
}
