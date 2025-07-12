"""
Models for the aggregator app.
"""

from django.db import models
from django.utils import timezone


class Article(models.Model):
    """
    Model representing a news article.
    """
    title = models.CharField(max_length=500, help_text="Article title")
    summary = models.TextField(help_text="Article summary or description")
    url = models.URLField(max_length=1000, help_text="Original article URL")
    source = models.CharField(max_length=100, help_text="News source name")
    published_at = models.DateTimeField(help_text="When the article was published")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the record was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the record was last updated")

    class Meta:
        # Prevent duplicate articles from the same source
        unique_together = ['url', 'source']
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['source']),
            models.Index(fields=['published_at']),
            models.Index(fields=['created_at']),
            models.Index(fields=['source', 'published_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.source}"

    def save(self, *args, **kwargs):
        # Ensure published_at is set
        if not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)