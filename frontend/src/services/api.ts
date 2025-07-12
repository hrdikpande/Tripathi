import axios from 'axios';
import { Article, ArticleStats, PaginatedResponse, FilterOptions, HealthStatus, ScrapingTask } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const articlesAPI = {
  // Get all articles with optional filters
  getArticles: async (filters: FilterOptions = {}): Promise<PaginatedResponse<Article>> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/articles/?${params.toString()}`);
    return response.data;
  },

  // Get single article by ID
  getArticle: async (id: number): Promise<Article> => {
    const response = await api.get(`/articles/${id}/`);
    return response.data;
  },

  // Get article statistics
  getStats: async (): Promise<ArticleStats> => {
    const response = await api.get('/articles/stats/');
    return response.data;
  },

  // Get latest articles (last 24 hours)
  getLatest: async (): Promise<Article[]> => {
    const response = await api.get('/articles/latest/');
    return response.data;
  },

  // Trigger manual scraping
  triggerScraping: async (): Promise<ScrapingTask> => {
    const response = await api.post('/articles/scrape/');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<HealthStatus> => {
    const response = await api.get('/articles/health/');
    return response.data;
  },
};

export default api;