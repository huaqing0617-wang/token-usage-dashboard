/**
 * Pure, replay-free token accounting for the Token Usage Dashboard.
 *
 * The dashboard reads the durable Session log, not the live token meter, so
 * its totals describe recorded model calls and can be reconstructed after a
 * restart. Each `assistant/message` carries the provider-reported usage and the
 * exact provider/model route; fork-inherited events are skipped because the
 * parent Session already accounts for those calls.
 */

import { PRICING_INFO, priceUsage } from './pricing.js';

/** The dashboard's "today" follows the Host's local calendar. */
const LOCAL_TIME_ZONE = resolveTimeZone();

/** Cached local calendar formatter, shared by ingestion and snapshots. */
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: LOCAL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Resolve the machine time zone without letting a hostile ICU configuration break startup. */
function resolveTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  } catch {
    return 'Asia/Shanghai';
  }
}

/**
 * Format an epoch millisecond as a local `YYYY-MM-DD` key.
 * @param {number} time
 * @returns {string}
 */
function dayKey(time) {
  const parts = DAY_FORMAT.formatToParts(new Date(time));
  const values = {};
  for (const part of parts) if (part.type !== 'literal') values[part.type] = part.value;
  return `${values.year}-${values.month}-${values.day}`;
}

/** Create one empty aggregate bucket. */
function emptyBucket() {
  return {
    tokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    costUsd: 0,
    pricedTokens: 0,
    unpricedTokens: 0,
    calls: 0,
    unpricedCalls: 0,
  };
}

/**
 * Add one usage record to a bucket.
 * @param {ReturnType<typeof emptyBucket>} bucket
 * @param {object} record
 */
function addRecord(bucket, record) {
  bucket.tokens += record.tokens;
  bucket.inputTokens += record.inputTokens;
  bucket.outputTokens += record.outputTokens;
  bucket.cacheReadTokens += record.cacheReadTokens;
  bucket.cacheWriteTokens += record.cacheWriteTokens;
  bucket.calls += 1;
  if (record.priced) {
    bucket.costUsd += record.costUsd;
    bucket.pricedTokens += record.tokens;
  } else {
    bucket.unpricedTokens += record.tokens;
    bucket.unpricedCalls += 1;
  }
}

/** Coerce one reported token count. */
function tokenCount(value) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Validate and convert one durable Session event into a dashboard record.
 * @param {string} sessionId
 * @param {object} event
 * @param {number} inheritedEventCount
 * @returns {object | undefined}
 */
export function usageRecordFromEvent(sessionId, event, inheritedEventCount = 0) {
  if (event?.type !== 'assistant/message') return undefined;
  const seq = Number.isSafeInteger(event.seq) ? event.seq : undefined;
  if (seq === undefined || seq < inheritedEventCount) return undefined;
  const usage = event.data?.usage;
  if (usage === null || typeof usage !== 'object') return undefined;

  const inputTokens = tokenCount(usage.inputTokens);
  const outputTokens = tokenCount(usage.outputTokens);
  const cacheReadTokens = tokenCount(usage.cacheReadTokens);
  const cacheWriteTokens = tokenCount(usage.cacheWriteTokens);
  const bucketTotal = inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
  const reportedTotal = tokenCount(usage.totalTokens);
  const tokens = bucketTotal > 0 ? bucketTotal : reportedTotal;
  if (tokens === 0) return undefined;

  const source = event.data?.message?.source;
  const provider = typeof source?.provider === 'string' && source.provider.length > 0 ? source.provider : 'unknown';
  const model = typeof source?.model === 'string' && source.model.length > 0 ? source.model : 'unknown';
  const time = Number.isFinite(event.time) ? event.time : Date.now();
  const price = bucketTotal > 0 ? priceUsage(provider, model, usage, time) : { priced: false, costUsd: 0, peak: false };

  return {
    sessionId,
    seq,
    time,
    dayKey: dayKey(time),
    provider,
    model,
    tokens,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    priced: price.priced,
    costUsd: price.costUsd,
    peak: price.peak,
  };
}

/**
 * In-memory account of every recorded model call in the profile.
 *
 * `ingest` is idempotent by Session id and sequence number, so a live event
 * that also appears in the startup scan is counted once. The scan runs in the
 * background and the authenticated route can return a partial snapshot while
 * it is still running.
 */
export class UsageAggregator {
  constructor() {
    this.timeZone = LOCAL_TIME_ZONE;
    this.records = [];
    this.seen = new Set();
    this.scan = {
      ready: false,
      scanning: false,
      totalSessions: 0,
      completedSessions: 0,
      failedSessions: 0,
      startedAt: null,
      finishedAt: null,
      error: null,
    };
    this.resolveReady = undefined;
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  /**
   * Ingest one durable event. Returns false for non-usage, inherited, duplicate,
   * or malformed events.
   * @param {string} sessionId
   * @param {object} event
   * @param {number} inheritedEventCount
   * @returns {boolean}
   */
  ingest(sessionId, event, inheritedEventCount = 0) {
    const record = usageRecordFromEvent(sessionId, event, inheritedEventCount);
    if (record === undefined) return false;
    const key = `${sessionId}\u0000${record.seq}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.records.push(record);
    return true;
  }

  /** Mark the background scan as started. */
  startScan(totalSessions = 0) {
    this.scan = {
      ...this.scan,
      scanning: true,
      totalSessions,
      startedAt: Date.now(),
    };
  }

  /** Record one scanned Session. */
  finishSession(ok, error) {
    this.scan.completedSessions += 1;
    if (!ok) {
      this.scan.failedSessions += 1;
      this.scan.error = error instanceof Error ? error.message : String(error);
    }
  }

  /** Finish the scan and release every route waiting on the first snapshot. */
  finishScan(error) {
    if (error !== undefined && error !== null) {
      this.scan.error = error instanceof Error ? error.message : String(error);
    }
    this.scan.scanning = false;
    this.scan.ready = true;
    this.scan.finishedAt = Date.now();
    this.resolveReady?.();
  }

  /**
   * Wait for the first scan, bounded by a timeout so a slow disk cannot hold a
   * dashboard request open indefinitely.
   * @param {number} timeoutMs
   * @returns {Promise<boolean>} true when the scan is ready
   */
  async waitReady(timeoutMs = 6000) {
    if (this.scan.ready) return true;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), Math.max(0, timeoutMs));
    });
    const result = await Promise.race([this.ready.then(() => true), timeout]);
    clearTimeout(timer);
    return result;
  }

  /**
   * Build one detached snapshot for the authenticated client route.
   * @returns {object}
   */
  snapshot() {
    const now = Date.now();
    const todayKey = dayKey(now);
    const total = emptyBucket();
    const today = emptyBucket();
    /** @type {Map<string, ReturnType<typeof emptyBucket> & {provider: string, model: string}>} */
    const models = new Map();

    for (const record of this.records) {
      addRecord(total, record);
      if (record.dayKey === todayKey) addRecord(today, record);
      const key = `${record.provider}\u0000${record.model}`;
      let bucket = models.get(key);
      if (bucket === undefined) {
        bucket = { ...emptyBucket(), provider: record.provider, model: record.model };
        models.set(key, bucket);
      }
      addRecord(bucket, record);
    }

    const byModel = Array.from(models.values())
      .map((bucket) => ({
        provider: bucket.provider,
        model: bucket.model,
        tokens: bucket.tokens,
        inputTokens: bucket.inputTokens,
        outputTokens: bucket.outputTokens,
        cacheReadTokens: bucket.cacheReadTokens,
        cacheWriteTokens: bucket.cacheWriteTokens,
        costUsd: bucket.costUsd,
        pricedTokens: bucket.pricedTokens,
        unpricedTokens: bucket.unpricedTokens,
        calls: bucket.calls,
      }))
      .sort((a, b) => b.costUsd - a.costUsd || b.tokens - a.tokens);

    return {
      version: 1,
      generatedAt: now,
      timeZone: this.timeZone,
      todayKey,
      today,
      total,
      byModel,
      pricing: PRICING_INFO,
      scan: { ...this.scan },
    };
  }
}
