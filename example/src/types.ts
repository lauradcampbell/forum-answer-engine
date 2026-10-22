export type Hosting = "cloud" | "self-hosted";

/** One app in the catalog, described for the engine, not for buyers. */
export interface CatalogApp {
  id: string;
  name: string;
  /** The problem the app solves, in plain words. Not its feature list. */
  problem: string;
  /** Phrases people actually use on the forum when they have this problem. */
  forumPhrases: string[];
  hosting: Hosting[];
  /** What the platform already does on its own. If that's enough, don't push the app. */
  nativeAlternative: string;
  /** Words that signal the asker only needs the native feature. */
  nativeEnoughSignals: string[];
  marketplaceUrl: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  body: string;
  /** Replies already posted in the thread. */
  replies: string[];
  hasAcceptedAnswer: boolean;
}

/** A labelled question in the test set. */
export interface TestCase extends ForumQuestion {
  /** The app that should match, or null when nothing should. */
  expected: string | null;
  /** Why, in one line. Traps say what they're testing. */
  note: string;
}

export interface Candidate {
  app: CatalogApp;
  score: number;
}

/** The fixed yes/no questions the judge must answer before it scores a match. */
export interface DealBreakers {
  wrongHosting: boolean;
  nativeFeatureIsEnough: boolean;
  isBugReport: boolean;
  alreadyAnswered: boolean;
}

export interface Verdict {
  appId: string | null;
  confidence: number;
  dealBreakers: DealBreakers;
  reasoning: string;
}

export type Outcome =
  | { kind: "spam"; reason: string }
  | { kind: "filtered"; reason: string; candidates: Candidate[] }
  | { kind: "rejected"; reason: string; verdict: Verdict }
  | { kind: "match"; app: CatalogApp; verdict: Verdict; draftLink: string };
