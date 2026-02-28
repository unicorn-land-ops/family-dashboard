export interface NewsHeadline {
  source: string; // "BBC" | "DW" | "Tagesschau" | "HN" | "TechCrunch"
  title: string;
}

export interface NewsTickerResponse {
  headlines: NewsHeadline[];
  error?: string;
}
