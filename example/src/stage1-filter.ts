import OpenAI from "openai";
import type { CatalogApp, Candidate, ForumQuestion } from "./types.ts";

/**
 * Stage 1: a cheap, deliberately loose filter. Its job is never to lose a real match, not to be
 * precise. Questions that pass carry their three closest apps forward to the judge.
 *
 * With OPENAI_API_KEY set it compares OpenAI embeddings ("fingerprints"). Without it, it falls
 * back to a word-overlap score so the example runs offline.
 */
export const KEEP_TOP = 3;
export const MIN_SCORE = { openai: 0.3, offline: 0.12 };

const appText = (a: CatalogApp) => `${a.problem} ${a.forumPhrases.join(". ")}`;
const questionText = (q: ForumQuestion) => `${q.title}. ${q.body}`;

export interface Filter {
  mode: "openai" | "offline";
  shortlist(q: ForumQuestion): Promise<Candidate[]>;
}

export async function createFilter(catalog: CatalogApp[]): Promise<Filter> {
  if (process.env.OPENAI_API_KEY) return openaiFilter(catalog);
  return offlineFilter(catalog);
}

// --- OpenAI embeddings -----------------------------------------------------------------------

async function openaiFilter(catalog: CatalogApp[]): Promise<Filter> {
  const openai = new OpenAI();
  const embed = async (texts: string[]) => {
    const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: texts });
    return res.data.map((d) => d.embedding);
  };
  // The catalog is embedded once per run; in production these vectors live in PostgreSQL.
  const appVectors = await embed(catalog.map(appText));

  return {
    mode: "openai",
    async shortlist(q) {
      const [qv] = await embed([questionText(q)]);
      return rank(catalog, appVectors.map((v) => cosine(qv, v)), MIN_SCORE.openai);
    },
  };
}

// --- Offline fallback: TF-IDF word overlap ---------------------------------------------------

const STOP = new Set(
  "a an and are as at be but by can do for from get have how i if in into is it its just my no not of on or our so that the their them then there they this to us we what when with you your".split(
    " ",
  ),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => t.replace(/(ing|es|s)$/, ""));
}

function offlineFilter(catalog: CatalogApp[]): Filter {
  const docs = catalog.map((a) => tokens(appText(a)));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) => Math.log((docs.length + 1) / ((df.get(t) ?? 0) + 1)) + 1;
  const vectorize = (ts: string[]) => {
    const v = new Map<string, number>();
    for (const t of ts) v.set(t, (v.get(t) ?? 0) + idf(t));
    return v;
  };
  const appVectors = docs.map(vectorize);

  return {
    mode: "offline",
    async shortlist(q) {
      const qv = vectorize(tokens(questionText(q)));
      return rank(catalog, appVectors.map((v) => sparseCosine(qv, v)), MIN_SCORE.offline);
    },
  };
}

// --- Shared ----------------------------------------------------------------------------------

function rank(catalog: CatalogApp[], scores: number[], min: number): Candidate[] {
  return catalog
    .map((app, i) => ({ app, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, KEEP_TOP)
    .filter((c, i) => i === 0 ? c.score >= min : c.score >= min / 2);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function sparseCosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [t, w] of a) dot += w * (b.get(t) ?? 0);
  const norm = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, w) => s + w * w, 0));
  return dot / (norm(a) * norm(b) || 1);
}
