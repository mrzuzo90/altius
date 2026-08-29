export type TargetDirection = "above" | "below";

export type WatchlistItemStatus = "watching" | "triggered";

export type WatchlistItem = {
  ticker: string;
  companyName: string;
  targetPrice: number | null;
  targetDirection: TargetDirection | null;
  referencePrice: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
  status: WatchlistItemStatus;
  triggeredAt: string | null;
  triggeredPrice: number | null;
};

export type WatchlistQuote = {
  ticker: string;
  price: number;
  previousClose: number | null;
  changePct: number | null;
  currency: string;
  date: string;
  source: string;
};

export type WatchlistTargetInput = {
  ticker: string;
  companyName: string;
  targetPrice: number | null;
  targetDirection: TargetDirection | null;
  referencePrice: number | null;
  currency: string | null;
};
