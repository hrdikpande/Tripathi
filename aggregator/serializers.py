"""
Serializers for the aggregator app.
"""

from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    """
    Serializer for Article model.
    """
    
    class Meta:
        model = Article
        fields = [
            'id',
            'title',
            'summary',
            'url',
            'source',
            'published_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_url(self, value):
        """Validate URL field."""
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value

    def validate_title(self, value):
        """Validate title field."""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Title must be at least 10 characters long")
        return value.strip()

    def validate_summary(self, value):
        """Validate summary field."""
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Summary must be at least 20 characters long")
        return value.strip()


class ArticleListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for article lists.
    """
    
    class Meta:
        model = Article
        fields = [
            'id',
            'title',
            'source',
            'published_at',
            'url'
        ]


class ArticleStatsSerializer(serializers.Serializer):
    """
    Serializer for article statistics.
    """
    total_articles = serializers.IntegerField()
    sources = serializers.ListField(child=serializers.CharField())
    latest_article_date = serializers.DateTimeField()
    articles_by_source = serializers.DictField()