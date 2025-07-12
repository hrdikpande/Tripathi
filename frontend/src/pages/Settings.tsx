import React, { useState, useEffect } from 'react';
import { HealthStatus } from '../types';
import { articlesAPI } from '../services/api';
import { Settings as SettingsIcon, Server, Database, Zap, RefreshCw, Play } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Settings: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealthStatus = async () => {
    try {
      const healthData = await articlesAPI.healthCheck();
      setHealth(healthData);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        status: 'unhealthy',
        database: 'error',
        cache: 'error',
        total_articles: 0,
        recent_articles: 0,
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerScraping = async () => {
    try {
      setScrapingLoading(true);
      await articlesAPI.triggerScraping();
      // Refresh health status after scraping
      setTimeout(() => {
        fetchHealthStatus();
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger scraping:', error);
    } finally {
      setScrapingLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchHealthStatus();
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-primary-600" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor system health and manage scraping operations
        </p>
      </div>

      {/* Controls */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={fetchHealthStatus}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
          
          <button
            onClick={triggerScraping}
            disabled={scrapingLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className={`w-4 h-4 ${scrapingLoading ? 'animate-spin' : ''}`} />
            <span>Trigger Scraping</span>
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              autoRefresh
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}</span>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : health ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Server className="w-6 h-6 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Overall Status</h3>
                  <p className="text-sm text-gray-600">System health check</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </span>
            </div>

            {/* Component Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Database</h4>
                    <p className="text-sm text-gray-600">PostgreSQL connection</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(health.database)}`}>
                  {health.database.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cache</h4>
                    <p className="text-sm text-gray-600">Redis connection</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(health.cache)}`}>
                  {health.cache.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {health.total_articles.toLocaleString()}
                </div>
                <div className="text-sm text-blue-800">Total Articles</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {health.recent_articles}
                </div>
                <div className="text-sm text-green-800">Recent Articles (1h)</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-bold text-purple-600">
                  {new Date(health.timestamp).toLocaleString()}
                </div>
                <div className="text-sm text-purple-800">Last Check</div>
              </div>
            </div>

            {/* Error Details */}
            {health.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                <p className="text-sm text-red-700">{health.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to load health status</p>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scraping Interval
              </label>
              <select className="input-field">
                <option value="600">10 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Articles per Source
              </label>
              <input
                type="number"
                defaultValue={20}
                min={1}
                max={100}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Sources
            </label>
            <div className="space-y-2">
              {['BBC News', 'CNN News', 'InShorts', 'Hindustan Times'].map((source) => (
                <label key={source} className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{source}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button className="btn-primary">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;