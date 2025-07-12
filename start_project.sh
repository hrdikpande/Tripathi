#!/bin/bash

# News Scraper Project Startup Script

echo "🚀 Starting News Scraper Application..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser (if needed)..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the application:"
echo "1. Start Redis: redis-server"
echo "2. Start Django: python manage.py runserver"
echo "3. Start Celery Worker: celery -A news_scraper worker --loglevel=info"
echo "4. Start Celery Beat: celery -A news_scraper beat --loglevel=info"
echo "5. Start Frontend: cd frontend && npm start"
echo ""
echo "🌐 Access points:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000/api/"
echo "- Admin Panel: http://localhost:8000/admin/"
echo "- API Docs: http://localhost:8000/api/docs/"
echo "- Flower (Celery): http://localhost:5555"