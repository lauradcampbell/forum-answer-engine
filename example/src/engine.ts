import type { CatalogApp, DealBreakers, ForumQuestion, Outcome } from "./types.ts";
import { spamReason } from "./spam.ts";
import type { Filter } from "./stage1-filter.ts";
import type { Judge } from "./stage2-judge.ts";

/** Below this, a match isn't worth a reviewer's time, whatever the judge says. */
export const MIN_CONFIDENCE = 0.6;

const DEAL_BREAKER_LABELS: Record<keyof DealBreakers, string> = {
  wrongHosting: "wrong hosting type",
  nativeFeatureIsEnough: "the platform already does this",
  isBugReport: "bug report about a built-in feature",
  alreadyAnswered: "thread already answered",
};

/** One question through the whole pipeline. */
export async function processQuestion(
  q: ForumQuestion,
  catalog: CatalogApp[],
  filter: Filter,
  judge: Judge,
): Promise<Outcome> {
  const spam = spamReason(q);
  if (spam) return { kind: "spam", reason: spam };

  const candidates = await filter.shortlist(q);
  if (candidates.length === 0) {
    return { kind: "filtered", reason: "no app close enough", candidates };
  }

  const verdict = await judge.judge(q, candidates);

  // The rules that matter are enforced here, in code, not left to the judge's wording. If any
  // deal-breaker is true, the match is thrown out however confident the judge sounds.
  const broken = (Object.keys(verdict.dealBreakers) as (keyof DealBreakers)[]).filter(
    (k) => verdict.dealBreakers[k],
  );
  if (broken.length > 0) {
    return { kind: "rejected", reason: broken.map((k) => DEAL_BREAKER_LABELS[k]).join(", "), verdict };
  }
  if (!verdict.appId) return { kind: "rejected", reason: "judge said no match", verdict };
  if (verdict.confidence < MIN_CONFIDENCE) {
    return { kind: "rejected", reason: `confidence ${verdict.confidence.toFixed(2)} too low`, verdict };
  }

  // The judge can only pick from the shortlist. Anything else is treated as an error, not a match.
  const app = candidates.find((c) => c.app.id === verdict.appId)?.app;
  if (!app) return { kind: "rejected", reason: `judge named an app outside the shortlist`, verdict };

  return { kind: "match", app, verdict, draftLink: trackedLink(app, q) };
}

/**
 * Rule-based check on the draft reply's link: it must point at the marketplace and carry a tag
 * unique to this question, so clicks and trials can be traced back to the answer that caused them.
 */
export function trackedLink(app: CatalogApp, q: ForumQuestion): string {
  const url = new URL(app.marketplaceUrl);
  if (url.hostname !== "marketplace.example") throw new Error(`Unexpected link host: ${url.hostname}`);
  url.searchParams.set("utm_source", "forum");
  url.searchParams.set("utm_content", q.id);
  return url.toString();
}
