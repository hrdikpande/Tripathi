export interface Article {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleStats {
  total_articles: number;
  sources: string[];
  latest_article_date: string | null;
  articles_by_source: Record<string, number>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WebSocketMessage {
  type: 'latest_articles' | 'stats' | 'news_update' | 'error';
  data?: any;
  message?: string;
}

export interface FilterOptions {
  source?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: string;
  cache: string;
  total_articles: number;
  recent_articles: number;
  timestamp: string;
  error?: string;
}

export interface ScrapingTask {
  message: string;
  task_id: string;
  status: string;
}