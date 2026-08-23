export type NewsCategory = "regulatory" | "earnings" | "market" | "general";

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
  isRegulatory?: boolean;
  category?: NewsCategory;
  sentiment?: "bullish" | "bearish" | "neutral";
};

export type CompanyNewsResult = {
  ticker: string;
  companyName: string;
  news: NewsItem[];
  sources: string[];
};
