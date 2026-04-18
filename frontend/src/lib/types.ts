export type Loyalty = "RCB" | "DC" | "NEUTRAL";

export type ReactionType =
  | "PUMPED" | "GUTTED" | "FURIOUS" | "PROUD"
  | "WOW" | "BRILLIANT" | "INTERESTING" | "INTENSE";

export type EventType =
  | "WICKET" | "SIX" | "FOUR" | "FIFTY" | "HUNDRED"
  | "OVER_COMPLETE" | "MATCH_START" | "MATCH_END";

export interface MatchEvent {
  eventId: string;
  matchId: string;
  type: EventType;
  player: string;
  team: string;
  over: string;
  scoreAfter: string;
  contextSummary?: string;
  significanceScore?: number;
  isControversial?: boolean;
  verdictQuestion?: string | null;
  fanPulse?: string;
  discussionStarters?: string[];
  isVerdictWorthy?: boolean;
  reactionCounts: Record<string, number>;
  timestamp?: { seconds: number; nanoseconds: number };
}

export interface Fan {
  fanId: string;
  displayName: string;
  loyalty: Loyalty;
  reactionHistory: string[];
  matchedWith: string[];
  isDemo: boolean;
  matchId: string;
}

export interface FanMatch {
  fan1Id: string;
  fan2Id: string;
  type: "TWIN" | "RIVAL";
  reason: string;
  sharedEvents: string[];
  notified: boolean;
}

export interface Verdict {
  eventId: string;
  question: string;
  votes: Record<"YES" | "NO" | "CLOSE_CALL", Record<Loyalty, number>>;
  geminiAnalysis: string;
  closedAt: null | string;
}

export interface DirectMessage {
  fanMatchId: string;
  senderId: string;
  senderName: string;
  senderLoyalty: Loyalty;
  text: string;
  timestamp?: { seconds: number; nanoseconds: number };
}
