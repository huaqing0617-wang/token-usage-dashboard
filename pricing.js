/**
 * DeepSeek official token pricing used by the usage dashboard.
 *
 * Prices are USD per one million tokens, from the official Models & Pricing
 * page checked on 2026-11-03. Peak hours are 01:00-04:00 and 06:00-10:00 UTC,
 * Monday through Friday, excluding Chinese public holidays; the off-peak rate
 * is half of the peak rate.
 *
 * This is an estimate, not a billing record. Only official DeepSeek routes
 * have prices here; third-party relays are reported as unpriced instead of
 * being silently guessed.
 */

export const PRICING_AS_OF = '2026-11-03';
export const PRICING_SOURCE = 'https://api-docs.deepseek.com/quick_start/pricing/';
export const PRICING_CURRENCY = 'USD';

/** @typedef {{ cacheHit: number, cacheMiss: number, output: number }} ModelRate */
/** @typedef {{ peak: ModelRate, offPeak: ModelRate }} ModelPricing */

/** @type {Record<string, ModelPricing>} */
const OFFICIAL_PRICING = {
  'deepseek-flash': {
    peak: { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 },
    offPeak: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  },
  'deepseek-v4-flash': {
    peak: { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 },
    offPeak: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  },
  'deepseek-v4-flash-vision-exp': {
    peak: { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 },
    offPeak: { cacheHit: 0.003, cacheMiss: 0.15, output: 0.6 },
  },
  'deepseek-v4-pro': {
    peak: { cacheHit: 0.044, cacheMiss: 1.32, output: 3.96 },
    offPeak: { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 },
  },
};

/**
 * Chinese public holidays in 2026, from the State Council notice
 * 国办发明电〔2025〕7号. Only dates inside the relevant year are needed for the
 * peak/off-peak decision.
 */
const CHINESE_HOLIDAYS = new Set([
  '2026-01-01',
  '2026-01-02',
  '2026-01-03',
  '2026-02-15',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-02-20',
  '2026-02-21',
  '2026-02-22',
  '2026-02-23',
  '2026-04-04',
  '2026-04-05',
  '2026-04-06',
  '2026-05-01',
  '2026-05-02',
  '2026-05-03',
  '2026-05-04',
  '2026-05-05',
  '2026-06-19',
  '2026-06-20',
  '2026-06-21',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
  '2026-10-01',
  '2026-10-02',
  '2026-10-03',
  '2026-10-04',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
]);

/** Providers whose invoices follow the DeepSeek public price sheet. */
const OFFICIAL_PROVIDERS = new Set(['deepseek-official', 'deepseek-account']);

/** Format the fixed UTC+8 calendar date used by the Chinese holiday table. */
function chinaDateKey(time) {
  return new Date(time + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Whether one model call falls in DeepSeek's peak-price window.
 *
 * The provider defines peak in UTC weekday/hour terms; the Chinese-holiday
 * exception is a calendar date in China Standard Time. Both 01:00-04:00 and
 * 06:00-10:00 UTC land on the same Beijing date, so the holiday lookup uses
 * the Beijing date while the weekday and hour stay in UTC.
 *
 * @param {number} time epoch milliseconds
 * @returns {boolean}
 */
export function isPeakAt(time) {
  const date = new Date(time);
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = date.getUTCHours();
  const inWindow = (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
  if (!inWindow) return false;
  return !CHINESE_HOLIDAYS.has(chinaDateKey(time));
}

/**
 * Price one recorded assistant call.
 *
 * `cacheWriteTokens` has no separately published price and is charged at the
 * cache-miss input rate. Unsupported routes return `priced: false` with cost 0
 * so the caller can disclose that the total is partial.
 *
 * @param {string} provider
 * @param {string} model
 * @param {{inputTokens?: number, outputTokens?: number, cacheReadTokens?: number, cacheWriteTokens?: number}} usage
 * @param {number} time epoch milliseconds
 * @returns {{ priced: boolean, costUsd: number, peak: boolean }}
 */
export function priceUsage(provider, model, usage, time) {
  if (!OFFICIAL_PROVIDERS.has(provider)) return { priced: false, costUsd: 0, peak: false };
  const pricing = OFFICIAL_PRICING[model];
  if (pricing === undefined) return { priced: false, costUsd: 0, peak: false };
  const peak = isPeakAt(time);
  const rate = peak ? pricing.peak : pricing.offPeak;
  const uncachedInput = count(usage.inputTokens);
  const cacheRead = count(usage.cacheReadTokens);
  const cacheWrite = count(usage.cacheWriteTokens);
  const output = count(usage.outputTokens);
  const costUsd =
    (uncachedInput * rate.cacheMiss +
      cacheRead * rate.cacheHit +
      cacheWrite * rate.cacheMiss +
      output * rate.output) /
    1e6;
  return { priced: true, costUsd, peak };
}

/** Coerce a reported token count to a non-negative safe integer. */
function count(value) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Describe the price sheet for the client's disclosure line. */
export const PRICING_INFO = {
  asOf: PRICING_AS_OF,
  currency: PRICING_CURRENCY,
  source: PRICING_SOURCE,
  peakSchedule: 'UTC 01:00-04:00, 06:00-10:00, Mon-Fri, excluding Chinese public holidays',
  unpricedRoutes: 'Routes outside DeepSeek official pricing are counted in tokens but not in estimated spend.',
};
