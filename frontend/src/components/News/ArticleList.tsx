import React from 'react';
import { Article } from '../../types';
import ArticleCard from './ArticleCard';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';

interface ArticleListProps {
  articles: Article[];
  loading?: boolean;
  onArticleClick?: (article: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  articles, 
  loading = false, 
  onArticleClick 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        title="No articles found"
        description="Try adjusting your filters or check back later for new content."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onClick={() => onArticleClick?.(article)}
        />
      ))}
    </div>
  );
};

export default ArticleList;