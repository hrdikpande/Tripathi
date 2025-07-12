"""
Admin configuration for the aggregator app.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """
    Admin interface for Article model.
    """
    list_display = ['title_truncated', 'source', 'published_at', 'created_at', 'view_article']
    list_filter = ['source', 'published_at', 'created_at']
    search_fields = ['title', 'summary', 'source']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'published_at'
    list_per_page = 25
    
    fieldsets = (
        ('Article Information', {
            'fields': ('title', 'summary', 'url', 'source', 'published_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def title_truncated(self, obj):
        """Return truncated title for list display."""
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    title_truncated.short_description = 'Title'

    def view_article(self, obj):
        """Return a link to view the original article."""
        return format_html(
            '<a href="{}" target="_blank" rel="noopener">View Article</a>',
            obj.url
        )
    view_article.short_description = 'Link'

    def get_queryset(self, request):
        """Optimize queryset for admin list view."""
        return super().get_queryset(request).select_related()

    actions = ['mark_as_recent']

    def mark_as_recent(self, request, queryset):
        """Custom admin action to mark articles as recent."""
        from django.utils import timezone
        updated = queryset.update(published_at=timezone.now())
        self.message_user(
            request,
            f'{updated} articles were successfully marked as recent.'
        )
    mark_as_recent.short_description = "Mark selected articles as recent"