"""
Celery tasks for the aggregator app.
"""

import logging
from typing import List, Dict
from celery import shared_task
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from .models import Article
from .scrapers import get_scraper_node, get_scraper_function, SCRAPERS

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def scrape_and_store_articles(self, sources: List[str] = None):
    """
    Celery task to scrape articles from multiple sources and store them.
    
    Args:
        sources: List of source names to scrape. If None, scrapes all sources.
    """
    if sources is None:
        sources = list(SCRAPERS.keys())
    
    logger.info(f"Starting scraping task for sources: {sources}")
    
    total_articles = 0
    total_new_articles = 0
    
    for source in sources:
        try:
            # Simulate distributed scraping logic
            node = get_scraper_node(source)
            logger.info(f"Processing source '{source}' on {node}")
            
            # Get the appropriate scraper function
            scraper_func = get_scraper_function(source)
            if not scraper_func:
                logger.warning(f"No scraper found for source: {source}")
                continue
            
            # Scrape articles
            articles = scraper_func()
            total_articles += len(articles)
            
            # Store articles with deduplication
            new_count = store_articles(articles)
            total_new_articles += new_count
            
            logger.info(f"Processed {len(articles)} articles from {source}, {new_count} were new")
            
        except Exception as e:
            logger.error(f"Error processing source {source}: {e}")
            # Retry the task with exponential backoff
            if self.request.retries < self.max_retries:
                logger.info(f"Retrying task in {2 ** self.request.retries} seconds...")
                raise self.retry(countdown=2 ** self.request.retries)
            else:
                logger.error(f"Max retries reached for source {source}")
    
    # Invalidate cache after new articles are added
    if total_new_articles > 0:
        invalidate_article_cache()
    
    logger.info(f"Scraping task completed. Total: {total_articles}, New: {total_new_articles}")
    
    return {
        'total_articles': total_articles,
        'new_articles': total_new_articles,
        'sources_processed': sources,
        'timestamp': timezone.now().isoformat()
    }


def store_articles(articles: List[Dict]) -> int:
    """
    Store articles in the database with deduplication.
    
    Args:
        articles: List of article dictionaries
        
    Returns:
        Number of new articles created
    """
    new_articles_count = 0
    
    with transaction.atomic():
        for article_data in articles:
            try:
                # Use get_or_create for deduplication
                article, created = Article.objects.get_or_create(
                    url=article_data['url'],
                    source=article_data['source'],
                    defaults={
                        'title': article_data['title'],
                        'summary': article_data['summary'],
                        'published_at': article_data['published_at'],
                    }
                )
                
                if created:
                    new_articles_count += 1
                    logger.debug(f"Created new article: {article.title}")
                else:
                    # Update existing article if needed
                    updated = False
                    if article.title != article_data['title']:
                        article.title = article_data['title']
                        updated = True
                    if article.summary != article_data['summary']:
                        article.summary = article_data['summary']
                        updated = True
                    
                    if updated:
                        article.save()
                        logger.debug(f"Updated existing article: {article.title}")
                
            except Exception as e:
                logger.error(f"Error storing article {article_data.get('title', 'Unknown')}: {e}")
                continue
    
    return new_articles_count


@shared_task
def cleanup_old_articles(days_old: int = 30):
    """
    Clean up articles older than specified days.
    
    Args:
        days_old: Number of days after which articles should be deleted
    """
    cutoff_date = timezone.now() - timezone.timedelta(days=days_old)
    
    deleted_count, _ = Article.objects.filter(created_at__lt=cutoff_date).delete()
    
    logger.info(f"Cleaned up {deleted_count} articles older than {days_old} days")
    
    # Invalidate cache after cleanup
    invalidate_article_cache()
    
    return {
        'deleted_count': deleted_count,
        'cutoff_date': cutoff_date.isoformat(),
        'timestamp': timezone.now().isoformat()
    }


@shared_task
def scrape_single_source(source: str):
    """
    Scrape articles from a single source.
    
    Args:
        source: The source name to scrape
    """
    return scrape_and_store_articles.delay([source])


def invalidate_article_cache():
    """Invalidate all article-related cache keys."""
    cache_keys = [
        'articles_list_*',
        'articles_count_*',
        'latest_articles_*',
    ]
    
    for pattern in cache_keys:
        cache.delete_many(cache.keys(pattern))
    
    logger.info("Invalidated article cache")


@shared_task
def health_check():
    """
    Health check task to verify system status.
    """
    try:
        # Check database connectivity
        article_count = Article.objects.count()
        
        # Check cache connectivity
        cache.set('health_check', 'ok', 60)
        cache_status = cache.get('health_check')
        
        # Check recent scraping activity
        recent_articles = Article.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).count()
        
        return {
            'status': 'healthy',
            'database': 'ok',
            'cache': 'ok' if cache_status == 'ok' else 'error',
            'total_articles': article_count,
            'recent_articles': recent_articles,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }