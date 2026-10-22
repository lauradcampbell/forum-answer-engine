import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Candidate, ForumQuestion, Verdict } from "./types.ts";

/**
 * Stage 2: the judge. It reads the question, the replies already posted and the full catalog
 * entries for the shortlisted apps. Before it names a match, it has to answer a fixed list of
 * yes/no deal-breaker questions. The judge only *answers* them: the code in engine.ts decides.
 *
 * With ANTHROPIC_API_KEY set the judge is Claude. Without it, a rule-based stand-in answers the
 * same questions so the example runs offline.
 */
export interface Judge {
  mode: "claude" | "offline";
  judge(q: ForumQuestion, candidates: Candidate[]): Promise<Verdict>;
}

export function createJudge(): Judge {
  if (process.env.ANTHROPIC_API_KEY) return claudeJudge();
  return offlineJudge();
}

// --- Claude ----------------------------------------------------------------------------------

const VerdictSchema = z.object({
  dealBreakers: z.object({
    wrongHosting: z.boolean(),
    nativeFeatureIsEnough: z.boolean(),
    isBugReport: z.boolean(),
    alreadyAnswered: z.boolean(),
  }),
  appId: z.string().nullable(),
  confidence: z.number(),
  reasoning: z.string(),
});

const SYSTEM = `You review questions from a software platform's public forum for a vendor that sells apps for that platform.
Decide whether one of the candidate apps genuinely solves the asker's problem.

First answer every deal-breaker question honestly:
- wrongHosting: the asker's hosting type (cloud or self-hosted) isn't one the app supports.
- nativeFeatureIsEnough: what the platform already does natively covers what the asker needs.
- isBugReport: the asker is reporting a fault in a built-in feature, not asking how to do something.
- alreadyAnswered: the thread already has an accepted answer.

Then give appId (one of the candidate ids) or null, a confidence from 0 to 1, and one or two sentences of reasoning.
"No match" is a good answer. Most questions shouldn't match. Never pick an app just because it's the closest one.`;

function claudeJudge(): Judge {
  const client = new Anthropic();
  return {
    mode: "claude",
    async judge(q, candidates) {
      const apps = candidates.map(({ app }) => ({
        id: app.id,
        name: app.name,
        problem: app.problem,
        hosting: app.hosting,
        whatThePlatformDoesNatively: app.nativeAlternative,
      }));
      const response = await client.messages.parse({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              question: { title: q.title, body: q.body },
              repliesSoFar: q.replies,
              threadHasAcceptedAnswer: q.hasAcceptedAnswer,
              candidateApps: apps,
            }),
          },
        ],
        output_config: { format: zodOutputFormat(VerdictSchema) },
      });

      // A declined or unparseable answer is treated as "no match", never as a guess.
      if (response.stop_reason === "refusal" || !response.parsed_output) {
        return noMatch(`judge returned no verdict (${response.stop_reason})`);
      }
      return response.parsed_output;
    },
  };
}

// --- Offline stand-in ------------------------------------------------------------------------

const SELF_HOSTED = /self-hosted|on-prem|data cent(re|er)|own server/i;
const CLOUD = /\bcloud\b/i;
const BUG = /\b(bug|broken|stopped working|no longer|error|since (the|yesterday's) update)\b/i;

function offlineJudge(): Judge {
  return {
    mode: "offline",
    async judge(q, candidates) {
      if (candidates.length === 0) return noMatch("no candidates");
      const text = `${q.title} ${q.body}`.toLowerCase();
      // Like the real judge, read every shortlisted entry, not just the top score: an app whose
      // own forum phrases or native-feature signals appear in the question beats a word overlap.
      const hits = (c: Candidate) =>
        [...c.app.forumPhrases, ...c.app.nativeEnoughSignals].filter((p) => text.includes(p)).length;
      const best = [...candidates].sort((a, b) => hits(b) - hits(a) || b.score - a.score)[0];
      const asked = SELF_HOSTED.test(text) ? "self-hosted" : CLOUD.test(text) ? "cloud" : null;

      const dealBreakers = {
        wrongHosting: asked !== null && !best.app.hosting.includes(asked),
        nativeFeatureIsEnough: best.app.nativeEnoughSignals.some((s) => text.includes(s)),
        isBugReport: BUG.test(text),
        alreadyAnswered: q.hasAcceptedAnswer,
      };
      return {
        appId: best.app.id,
        confidence: Math.min(1, best.score / 0.3),
        dealBreakers,
        reasoning: `Closest app by wording is ${best.app.name} (score ${best.score.toFixed(2)}).`,
      };
    },
  };
}

function noMatch(reasoning: string): Verdict {
  return {
    appId: null,
    confidence: 0,
    dealBreakers: { wrongHosting: false, nativeFeatureIsEnough: false, isBugReport: false, alreadyAnswered: false },
    reasoning,
  };
}
