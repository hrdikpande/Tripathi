import React from 'react';
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import { FilterOptions } from '../../types';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  filters, 
  onFiltersChange, 
  onRefresh,
  loading = false 
}) => {
  const sources = [
    { value: '', label: 'All Sources' },
    { value: 'bbc_news', label: 'BBC News' },
    { value: 'cnn_news', label: 'CNN News' },
    { value: 'inshorts', label: 'InShorts' },
    { value: 'hindustan_times', label: 'Hindustan Times' },
  ];

  const handleInputChange = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1, // Reset to first page when filters change
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Source Filter */}
        <div className="lg:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filters.source || ''}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              {sources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date From */}
        <div className="lg:w-40">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleInputChange('date_from', e.target.value)}
              className="input-field pl-10"
              placeholder="From date"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="lg:w-40">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleInputChange('date_to', e.target.value)}
              className="input-field pl-10"
              placeholder="To date"
            />
          </div>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2 lg:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Active Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
            Search: "{filters.search}"
            <button
              onClick={() => handleInputChange('search', '')}
              className="ml-2 text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.source && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
            Source: {sources.find(s => s.value === filters.source)?.label}
            <button
              onClick={() => handleInputChange('source', '')}
              className="ml-2 text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.date_from && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
            From: {filters.date_from}
            <button
              onClick={() => handleInputChange('date_from', '')}
              className="ml-2 text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.date_to && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
            To: {filters.date_to}
            <button
              onClick={() => handleInputChange('date_to', '')}
              className="ml-2 text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default FilterBar;