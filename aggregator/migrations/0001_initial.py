# Generated migration for Article model

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Article title', max_length=500)),
                ('summary', models.TextField(help_text='Article summary or description')),
                ('url', models.URLField(help_text='Original article URL', max_length=1000)),
                ('source', models.CharField(help_text='News source name', max_length=100)),
                ('published_at', models.DateTimeField(help_text='When the article was published')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='When the record was created')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='When the record was last updated')),
            ],
            options={
                'ordering': ['-published_at', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['source'], name='aggregator_article_source_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['published_at'], name='aggregator_article_published_at_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['created_at'], name='aggregator_article_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['source', 'published_at'], name='aggregator_article_source_published_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='article',
            unique_together={('url', 'source')},
        ),
    ]