import { catalog } from "./catalog.ts";
import { processQuestion } from "./engine.ts";
import { createFilter } from "./stage1-filter.ts";
import { createJudge } from "./stage2-judge.ts";
import { testSet } from "./test-set.ts";

/**
 * Runs every labelled question through the engine and compares the result with the label.
 * Run it after every change: a fix that breaks something else shows up here before it ships.
 */
const filter = await createFilter(catalog);
const judge = createJudge();
console.log(`Stage 1: ${filter.mode}   Stage 2: ${judge.mode}\n`);

let right = 0;
let falseMatches = 0;
let missed = 0;
let wrongApp = 0;

for (const tc of testSet) {
  const outcome = await processQuestion(tc, catalog, filter, judge);
  const got = outcome.kind === "match" ? outcome.app.id : null;
  const ok = got === tc.expected;

  if (ok) right++;
  else if (tc.expected === null) falseMatches++;
  else if (got === null) missed++;
  else wrongApp++;

  const detail =
    outcome.kind === "match" ? outcome.draftLink : `${outcome.kind}: ${outcome.reason}`;
  console.log(`${ok ? "✓" : "✗"} ${tc.id}  expected ${tc.expected ?? "no match"}, got ${got ?? "no match"}`);
  console.log(`      ${detail}`);
  if (!ok) console.log(`      label note: ${tc.note}`);
}

console.log(
  `\n${right}/${testSet.length} right · ${falseMatches} false matches · ${missed} missed · ${wrongApp} wrong app`,
);
process.exitCode = right === testSet.length ? 0 : 1;
