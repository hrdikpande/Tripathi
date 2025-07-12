"""
Views for the aggregator app.
"""

import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Article
from .serializers import ArticleSerializer, ArticleListSerializer, ArticleStatsSerializer
from .tasks import scrape_and_store_articles, health_check

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List all articles",
        description="Retrieve a paginated list of all articles with optional filtering"
    ),
    retrieve=extend_schema(
        summary="Get article details",
        description="Retrieve detailed information about a specific article"
    ),
)
class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Article model providing read-only operations.
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source', 'published_at']
    search_fields = ['title', 'summary']
    ordering_fields = ['published_at', 'created_at']
    ordering = ['-published_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleSerializer

    def get_queryset(self):
        """
        Optionally filter articles by source and date range.
        """
        queryset = Article.objects.all()
        
        # Filter by source
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(published_at__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(published_at__lte=date_to)
            except ValueError:
                pass
        
        return queryset.select_related()

    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        """List articles with caching."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get article statistics",
        description="Retrieve statistics about articles including counts by source"
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get article statistics."""
        cache_key = 'article_stats'
        stats = cache.get(cache_key)
        
        if not stats:
            total_articles = Article.objects.count()
            sources = list(Article.objects.values_list('source', flat=True).distinct())
            
            latest_article = Article.objects.order_by('-published_at').first()
            latest_date = latest_article.published_at if latest_article else None
            
            articles_by_source = dict(
                Article.objects.values('source')
                .annotate(count=Count('id'))
                .values_list('source', 'count')
            )
            
            stats = {
                'total_articles': total_articles,
                'sources': sources,
                'latest_article_date': latest_date,
                'articles_by_source': articles_by_source
            }
            
            # Cache for 10 minutes
            cache.set(cache_key, stats, 600)
        
        serializer = ArticleStatsSerializer(stats)
        return Response(serializer.data)

    @extend_schema(
        summary="Get latest articles",
        description="Retrieve the most recent articles (last 24 hours)"
    )
    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(300))
    def latest(self, request):
        """Get latest articles from the last 24 hours."""
        yesterday = timezone.now() - timedelta(days=1)
        latest_articles = Article.objects.filter(
            published_at__gte=yesterday
        ).order_by('-published_at')[:20]
        
        serializer = ArticleListSerializer(latest_articles, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Trigger manual scraping",
        description="Manually trigger the scraping process for all sources"
    )
    @action(detail=False, methods=['post'])
    def scrape(self, request):
        """Manually trigger scraping."""
        try:
            # Trigger async scraping task
            task = scrape_and_store_articles.delay()
            
            return Response({
                'message': 'Scraping task started',
                'task_id': task.id,
                'status': 'started'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"Error triggering scraping: {e}")
            return Response({
                'error': 'Failed to start scraping task',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="System health check",
        description="Check the health status of the scraping system"
    )
    @action(detail=False, methods=['get'])
    def health(self, request):
        """Health check endpoint."""
        try:
            # Trigger health check task
            task = health_check.delay()
            result = task.get(timeout=10)  # Wait up to 10 seconds
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return Response({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)