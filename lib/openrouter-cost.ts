/** Rough pre-submit estimate (actual bill comes back in usage.cost). */
export const BDT_PER_USD = 130;

/** Whisper-class ballpark ~$0.006 / minute; Gemini STT closer to ~$0.005 / min blended. */
export const USD_PER_MINUTE_ESTIMATE = 0.005;

export type CostEstimate = {
  durationSeconds: number;
  usd: number;
  bdt: number;
};

export function estimateOpenRouterCost(durationSeconds: number): CostEstimate | null {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;
  const seconds = Math.ceil(durationSeconds);
  const usd = (seconds / 60) * USD_PER_MINUTE_ESTIMATE;
  return { durationSeconds: seconds, usd, bdt: usd * BDT_PER_USD };
}

export function formatBdt(n: number): string {
  if (n < 0.01) return "০.০১-এর কম";
  return new Intl.NumberFormat("bn-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatUsd(n: number): string {
  return n.toFixed(4);
}
