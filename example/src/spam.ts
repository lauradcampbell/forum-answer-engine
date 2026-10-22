import type { ForumQuestion } from "./types.ts";

/**
 * Posts that only exist to place a link are dropped before any AI is used. Replying to them would
 * only help the spammer. Plain rules are enough here.
 */
export function spamReason(q: ForumQuestion): string | null {
  const text = `${q.title} ${q.body}`;
  const links = text.match(/https?:\/\/\S+|www\.\S+/gi) ?? [];
  const words = text.split(/\s+/).filter(Boolean).length;
  const shouting = /!!!|\d+% off|cheap|deal/i.test(text);

  if (links.length >= 2 && words < 40) return `${links.length} links in a ${words}-word post`;
  if (links.length >= 1 && shouting) return "promotional link";
  return null;
}
