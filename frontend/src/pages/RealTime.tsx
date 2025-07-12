import React, { useState, useEffect } from 'react';
import { Article, ArticleStats } from '../types';
import { websocketService } from '../services/websocket';
import { articlesAPI } from '../services/api';
import ArticleList from '../components/News/ArticleList';
import StatusIndicator from '../components/UI/StatusIndicator';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

const RealTime: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // Initialize WebSocket connection
    const initWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        await websocketService.connect();
        setConnectionStatus('connected');

        // Subscribe to real-time updates
        websocketService.subscribe('latest_articles', (data: Article[]) => {
          setArticles(data);
          setLastUpdate(new Date());
        });

        websocketService.subscribe('stats', (data: ArticleStats) => {
          setStats(data);
        });

        websocketService.subscribe('news_update', (data: any) => {
          if (data.articles) {
            setArticles(data.articles);
            setLastUpdate(new Date());
            setUpdateCount(prev => prev + 1);
          }
        });

        // Request initial data
        websocketService.send({ type: 'get_latest' });
        websocketService.send({ type: 'get_stats' });

      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setConnectionStatus('disconnected');
        // Fallback to REST API
        loadInitialData();
      }
    };

    const loadInitialData = async () => {
      try {
        const [articlesData, statsData] = await Promise.all([
          articlesAPI.getLatest(),
          articlesAPI.getStats(),
        ]);
        setArticles(articlesData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const status = websocketService.getConnectionStatus();
      if (status === 'connected') {
        setConnectionStatus('connected');
      } else if (status === 'connecting') {
        setConnectionStatus('connecting');
      } else {
        setConnectionStatus('disconnected');
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    try {
      setConnectionStatus('connecting');
      await websocketService.connect();
      setConnectionStatus('connected');
      websocketService.send({ type: 'get_latest' });
      websocketService.send({ type: 'get_stats' });
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Activity className="w-8 h-8 mr-3 text-primary-600" />
              Real-time News Feed
            </h1>
            <p className="text-gray-600 mt-2">
              Live updates from news scrapers
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <StatusIndicator status={connectionStatus} />
            {connectionStatus === 'disconnected' && (
              <button
                onClick={handleReconnect}
                className="btn-primary text-sm"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_articles?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Live Updates</p>
              <p className="text-2xl font-bold text-gray-900">{updateCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sources</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.sources?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Update</p>
              <p className="text-sm font-bold text-gray-900">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      {connectionStatus === 'connected' && (
        <div className="mb-6">
          <div className="live-indicator">
            LIVE
          </div>
          <span className="ml-2 text-sm text-gray-600">
            Receiving real-time updates
          </span>
        </div>
      )}

      {/* Source Breakdown */}
      {stats && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Articles by Source
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.articles_by_source).map(([source, count]) => (
              <div key={source} className="text-center">
                <div className="text-xl font-bold text-primary-600">
                  {count}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {source.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Status Alert */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-yellow-800">
              <p className="font-medium">Connection Lost</p>
              <p className="text-sm">
                Real-time updates are unavailable. Showing cached data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Latest Articles */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Latest Articles
        </h2>
        <ArticleList
          articles={articles}
          onArticleClick={(article) => {
            window.open(article.url, '_blank');
          }}
        />
      </div>
    </div>
  );
};

export default RealTime;