import React, { useState, useEffect, useCallback } from 'react';
import { Article, FilterOptions, PaginatedResponse } from '../types';
import { articlesAPI } from '../services/api';
import ArticleList from '../components/News/ArticleList';
import FilterBar from '../components/News/FilterBar';
import Pagination from '../components/UI/Pagination';
import { Play, Pause, RefreshCw } from 'lucide-react';

const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    page_size: 12,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<Article> = await articlesAPI.getArticles(filters);
      
      setArticles(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: filters.page || 1,
        totalPages: Math.ceil(response.count / (filters.page_size || 12)),
      });
    } catch (err) {
      setError('Failed to fetch articles. Please try again.');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    fetchArticles();
  };

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
    } else {
      const interval = setInterval(() => {
        fetchArticles();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      setAutoRefresh(true);
    }
  };

  const triggerScraping = async () => {
    try {
      await articlesAPI.triggerScraping();
      // Refresh articles after a short delay
      setTimeout(() => {
        fetchArticles();
      }, 2000);
    } catch (err) {
      console.error('Error triggering scraping:', err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">News Feed</h1>
            <p className="text-gray-600 mt-2">
              Latest articles from multiple news sources
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Auto Refresh On</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Auto Refresh Off</span>
                </>
              )}
            </button>
            
            <button
              onClick={triggerScraping}
              className="btn-primary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scrape Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {pagination.count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {articles.length}
            </div>
            <div className="text-sm text-gray-600">Current Page</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {pagination.totalPages}
            </div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-800">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Articles */}
      <ArticleList
        articles={articles}
        loading={loading}
        onArticleClick={(article) => {
          window.open(article.url, '_blank');
        }}
      />

      {/* Pagination */}
      {!loading && articles.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNext={!!pagination.next}
            hasPrevious={!!pagination.previous}
          />
        </div>
      )}
    </div>
  );
};

export default NewsFeed;