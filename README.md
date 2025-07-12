# News Scraper - Production-Ready Django Application

A scalable Django application that scrapes articles from multiple news sources, stores them in a PostgreSQL database, and serves content via REST API with asynchronous background processing using Celery and Redis.

## 🚀 Features

- **Django Core Setup**: Production-ready Django application with `news_scraper` project and `aggregator` app
- **Web Scraping**: Scrapes articles from multiple sources (InShorts, Hindustan Times) with retry logic
- **Distributed Scraping**: Simulated distributed scraping logic using hash-based node selection
- **REST API**: Full-featured API with Django REST Framework including pagination, filtering, and search
- **Asynchronous Processing**: Celery with Redis for background scraping tasks
- **Caching**: Redis-based caching for improved performance
- **Database**: PostgreSQL with optimized indexes and constraints
- **Testing**: Comprehensive test suite covering models, scrapers, tasks, and API
- **Monitoring**: Health check endpoints and Flower for Celery monitoring
- **Documentation**: Auto-generated API documentation with Swagger/ReDoc

## 📋 Requirements

- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd news_scraper
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   # For SQLite (development)
   python manage.py migrate
   
   # For PostgreSQL (production)
   # Make sure PostgreSQL is running and update .env
   # Set USE_POSTGRES=True in .env
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start Redis server**
   ```bash
   redis-server
   ```

8. **Run the application**
   ```bash
   # Terminal 1: Django development server
   python manage.py runserver
   
   # Terminal 2: Celery worker
   celery -A news_scraper worker --loglevel=info
   
   # Terminal 3: Celery beat scheduler
   celery -A news_scraper beat --loglevel=info
   
   # Terminal 4: Flower monitoring (optional)
   celery -A news_scraper flower
   ```

### Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Run migrations**
   ```bash
   docker-compose exec web python manage.py migrate
   ```

3. **Create superuser**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Required |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `USE_POSTGRES` | Use PostgreSQL | `False` |
| `DB_NAME` | Database name | `news_scraper` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |

### Celery Configuration

The application includes automatic periodic scraping every 10 minutes. You can customize this in `news_scraper/celery.py`.

## 📚 API Documentation

### Endpoints

- **Articles API**: `/api/articles/`
  - `GET /api/articles/` - List all articles with pagination
  - `GET /api/articles/{id}/` - Get article details
  - `GET /api/articles/?source=inshorts` - Filter by source
  - `GET /api/articles/?search=keyword` - Search articles
  - `GET /api/articles/stats/` - Get article statistics
  - `GET /api/articles/latest/` - Get latest articles (24h)
  - `POST /api/articles/scrape/` - Trigger manual scraping
  - `GET /api/articles/health/` - Health check

### API Documentation URLs

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

### Example API Calls

```bash
# List all articles
curl http://localhost:8000/api/articles/

# Filter by source
curl http://localhost:8000/api/articles/?source=inshorts

# Search articles
curl http://localhost:8000/api/articles/?search=technology

# Get statistics
curl http://localhost:8000/api/articles/stats/

# Trigger manual scraping
curl -X POST http://localhost:8000/api/articles/scrape/

# Health check
curl http://localhost:8000/api/articles/health/
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
python manage.py test

# Run specific test module
python manage.py test aggregator.tests

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 📊 Monitoring

### Admin Interface

Access the Django admin at `http://localhost:8000/admin/` to view and manage articles.

### Flower (Celery Monitoring)

Access Flower at `http://localhost:5555/` to monitor Celery tasks and workers.

### Health Check

The application provides a health check endpoint at `/api/articles/health/` that verifies:
- Database connectivity
- Cache connectivity
- Recent scraping activity

## 🏗️ Architecture

### Project Structure

```
news_scraper/
├── news_scraper/          # Django project settings
│   ├── __init__.py
│   ├── settings.py        # Django settings
│   ├── celery.py         # Celery configuration
│   ├── urls.py           # Main URL configuration
│   ├── wsgi.py           # WSGI application
│   └── asgi.py           # ASGI application
├── aggregator/           # Main application
│   ├── models.py         # Article model
│   ├── views.py          # API views
│   ├── serializers.py    # DRF serializers
│   ├── scrapers.py       # Web scrapers
│   ├── tasks.py          # Celery tasks
│   ├── admin.py          # Django admin
│   ├── urls.py           # App URLs
│   └── tests.py          # Test suite
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── README.md           # This file
```

### Database Schema

**Article Model**:
- `id`: Primary key
- `title`: Article title (max 500 chars)
- `summary`: Article summary/description
- `url`: Original article URL (max 1000 chars)
- `source`: News source name (max 100 chars)
- `published_at`: Publication timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

**Constraints**:
- Unique together: `(url, source)` - Prevents duplicates
- Indexes on: `source`, `published_at`, `created_at`, `(source, published_at)`

### Distributed Scraping Logic

The application simulates distributed scraping using hash-based node selection:

```python
def get_scraper_node(source: str) -> str:
    node_id = hash(source) % 2
    return f"node_{node_id}"
```

This ensures consistent assignment of sources to nodes while distributing the load.

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set appropriate production values in `.env`
2. **Database**: Use PostgreSQL in production
3. **Static Files**: Configure proper static file serving
4. **Security**: Update `SECRET_KEY`, set `DEBUG=False`, configure `ALLOWED_HOSTS`
5. **Monitoring**: Set up proper logging and monitoring
6. **Scaling**: Use multiple Celery workers for high load

### Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.yml up -d

# Scale Celery workers
docker-compose up --scale celery=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the test suite for examples
- Open an issue on GitHub

## 🔄 Changelog

### v1.0.0
- Initial release
- Django application with Article model
- Web scraping with BeautifulSoup
- REST API with Django REST Framework
- Celery integration with Redis
- Comprehensive test suite
- Docker support
- API documentation