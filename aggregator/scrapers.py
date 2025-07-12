"""
Web scrapers for different news sources.
"""

import logging
import time
import random
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
from django.utils import timezone
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class BaseScraper:
    """Base class for all news scrapers."""
    
    def __init__(self):
        self.session = self._create_session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry strategy."""
        session = requests.Session()
        
        # Retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session

    def _make_request(self, url: str, timeout: int = 10) -> Optional[requests.Response]:
        """Make HTTP request with error handling and exponential backoff."""
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(
                    url, 
                    headers=self.headers, 
                    timeout=timeout
                )
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request attempt {attempt + 1} failed for {url}: {e}")
                
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                else:
                    logger.error(f"All retry attempts failed for {url}")
                    return None

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime object."""
        # This is a simplified implementation
        # In production, you'd want more robust date parsing
        try:
            # Try common date formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # If no format matches, return current time
            return timezone.now()
        except Exception as e:
            logger.warning(f"Failed to parse date '{date_str}': {e}")
            return timezone.now()


class InShortsScaper(BaseScraper):
    """Scraper for InShorts news website."""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://inshorts.com/en/read"
        self.source_name = "inshorts"

    def scrape_articles(self) -> List[Dict]:
        """Scrape articles from InShorts."""
        logger.info("Starting InShorts scraping...")
        articles = []
        
        try:
            response = self._make_request(self.base_url)
            if not response:
                return articles

            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find article containers (this is a mock structure)
            # In reality, you'd need to inspect the actual website structure
            article_cards = soup.find_all('div', class_='news-card')
            
            for card in article_cards[:20]:  # Limit to 20 articles
                try:
                    article_data = self._extract_article_data(card)
                    if article_data:
                        articles.append(article_data)
                except Exception as e:
                    logger.error(f"Error extracting article data: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping InShorts: {e}")

        logger.info(f"Scraped {len(articles)} articles from InShorts")
        return articles

    def _extract_article_data(self, card) -> Optional[Dict]:
        """Extract article data from a card element."""
        try:
            # Mock extraction - replace with actual selectors
            title_elem = card.find('span', itemprop='headline')
            summary_elem = card.find('div', itemprop='articleBody')
            url_elem = card.find('a', class_='clickable')
            
            if not all([title_elem, summary_elem, url_elem]):
                return None

            return {
                'title': title_elem.get_text(strip=True),
                'summary': summary_elem.get_text(strip=True),
                'url': url_elem.get('href', ''),
                'source': self.source_name,
                'published_at': timezone.now() - timedelta(hours=random.randint(1, 24))
            }
        except Exception as e:
            logger.error(f"Error extracting article data: {e}")
            return None


class HindustanTimesScaper(BaseScraper):
    """Scraper for Hindustan Times website."""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.hindustantimes.com/latest-news"
        self.source_name = "hindustan_times"

    def scrape_articles(self) -> List[Dict]:
        """Scrape articles from Hindustan Times."""
        logger.info("Starting Hindustan Times scraping...")
        articles = []
        
        try:
            response = self._make_request(self.base_url)
            if not response:
                return articles

            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find article containers (mock structure)
            article_elements = soup.find_all('div', class_='cartHolder')
            
            for element in article_elements[:20]:  # Limit to 20 articles
                try:
                    article_data = self._extract_article_data(element)
                    if article_data:
                        articles.append(article_data)
                except Exception as e:
                    logger.error(f"Error extracting article data: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping Hindustan Times: {e}")

        logger.info(f"Scraped {len(articles)} articles from Hindustan Times")
        return articles

    def _extract_article_data(self, element) -> Optional[Dict]:
        """Extract article data from an element."""
        try:
            # Mock extraction - replace with actual selectors
            title_elem = element.find('h3', class_='hdg3')
            summary_elem = element.find('p', class_='anch')
            link_elem = element.find('a')
            
            if not all([title_elem, link_elem]):
                return None

            summary = summary_elem.get_text(strip=True) if summary_elem else title_elem.get_text(strip=True)
            
            return {
                'title': title_elem.get_text(strip=True),
                'summary': summary,
                'url': link_elem.get('href', ''),
                'source': self.source_name,
                'published_at': timezone.now() - timedelta(hours=random.randint(1, 24))
            }
        except Exception as e:
            logger.error(f"Error extracting article data: {e}")
            return None


# Mock scrapers for demonstration (since we can't actually scrape real sites)
class MockInShortsScaper(BaseScraper):
    """Mock scraper for InShorts - generates sample data."""
    
    def __init__(self):
        super().__init__()
        self.source_name = "inshorts"

    def scrape_articles(self) -> List[Dict]:
        """Generate mock articles for InShorts."""
        logger.info("Generating mock InShorts articles...")
        
        mock_articles = []
        for i in range(10):
            mock_articles.append({
                'title': f"InShorts Breaking News {i + 1}: Important Development in Technology",
                'summary': f"This is a mock summary for InShorts article {i + 1}. It contains important information about recent developments in the technology sector.",
                'url': f"https://inshorts.com/news/article-{i + 1}",
                'source': self.source_name,
                'published_at': timezone.now() - timedelta(hours=random.randint(1, 48))
            })
        
        logger.info(f"Generated {len(mock_articles)} mock articles from InShorts")
        return mock_articles


class MockHindustanTimesScaper(BaseScraper):
    """Mock scraper for Hindustan Times - generates sample data."""
    
    def __init__(self):
        super().__init__()
        self.source_name = "hindustan_times"

    def scrape_articles(self) -> List[Dict]:
        """Generate mock articles for Hindustan Times."""
        logger.info("Generating mock Hindustan Times articles...")
        
        mock_articles = []
        for i in range(10):
            mock_articles.append({
                'title': f"HT News Update {i + 1}: Major Political Development",
                'summary': f"This is a mock summary for Hindustan Times article {i + 1}. It covers significant political developments and their implications.",
                'url': f"https://hindustantimes.com/news/article-{i + 1}",
                'source': self.source_name,
                'published_at': timezone.now() - timedelta(hours=random.randint(1, 48))
            })
        
        logger.info(f"Generated {len(mock_articles)} mock articles from Hindustan Times")
        return mock_articles


def get_scraper_node(source: str) -> str:
    """
    Simulate distributed scraping logic using hash-based node selection.
    
    Args:
        source: The news source name
        
    Returns:
        Node identifier ('node_0' or 'node_1')
    """
    node_id = hash(source) % 2
    logger.info(f"Source '{source}' assigned to node_{node_id}")
    return f"node_{node_id}"


def scrape_inshorts() -> List[Dict]:
    """Scrape articles from InShorts."""
    scraper = MockInShortsScaper()  # Use MockInShortsScaper for demo
    return scraper.scrape_articles()


def scrape_ht() -> List[Dict]:
    """Scrape articles from Hindustan Times."""
    scraper = MockHindustanTimesScaper()  # Use MockHindustanTimesScaper for demo
    return scraper.scrape_articles()


# Scraper registry for easy access
SCRAPERS = {
    'inshorts': scrape_inshorts,
    'hindustan_times': scrape_ht,
}


def get_scraper_function(source: str):
    """Get the appropriate scraper function for a source."""
    return SCRAPERS.get(source)