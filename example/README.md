# The engine in miniature

A small, runnable version of the matching pipeline described in the [main README](../README.md),
written from scratch on invented data. The real engine's code, catalog, prompts and test set belong
to my employer and aren't here. This shows the same ideas working end to end.

The setting is made up: **Northdesk**, a help-desk platform with a cloud and a self-hosted edition,
and five apps for it that don't exist.

## Run it

You need Node.js 20 or later.

```bash
cd example
npm install
npm run test-set
```

It runs offline by default. Set an API key to swap in the real models:

| Variable | Swaps in |
|---|---|
| `OPENAI_API_KEY` | OpenAI embeddings for the stage 1 filter, instead of word overlap |
| `ANTHROPIC_API_KEY` | Claude as the stage 2 judge, instead of a rule-based stand-in |

## What you'll see

```
Stage 1: offline   Stage 2: offline

✓ q01  expected sla-clock, got sla-clock
      https://marketplace.example/apps/sla-clock-pro?utm_source=forum&utm_content=q01
✓ q02  expected no match, got no match
      rejected: wrong hosting type
...
✓ q11  expected no match, got no match
      spam: 2 links in a 17-word post
✓ q12  expected no match, got no match
      filtered: no app close enough

14/14 right · 0 false matches · 0 missed · 0 wrong app
```

Every question ends one of four ways: dropped as spam, filtered out at stage 1, rejected at stage 2
(with the reason), or matched with a tracked link ready for the draft reply.

## Where to look

| File | What it shows |
|---|---|
| [`src/test-set.ts`](src/test-set.ts) | 14 labelled questions, half of them traps: the right topic but the wrong hosting, a built-in feature that's enough, a bug report, a thread already answered |
| [`src/catalog.ts`](src/catalog.ts) | Apps described for the machine: the problem, real forum phrases, hosting, and what the platform already does natively |
| [`src/stage1-filter.ts`](src/stage1-filter.ts) | The cheap, loose filter that keeps the three closest apps |
| [`src/stage2-judge.ts`](src/stage2-judge.ts) | The judge, which must answer four yes/no deal-breaker questions before naming a match. With Claude, the answer comes back as structured output checked against a schema |
| [`src/engine.ts`](src/engine.ts) | Where the rules are enforced in code: any deal-breaker throws the match out, however confident the judge is |
| [`src/run-test-set.ts`](src/run-test-set.ts) | Runs the whole test set and reports what it got right and wrong |

## What it leaves out

The parts that need a real company around them: PostgreSQL storage, the scheduler, creating tickets
in an issue tracker, learning from reviewers' rejections, and the dashboard.
