"""Constants for the Mixcloud indexer."""

from pathlib import Path

# API Configuration
MIXCLOUD_BASE_URL = "https://api.mixcloud.com"
MIXCLOUD_USER = "punkrockradio"
API_PAGE_SIZE = 100  # Maximum page size for Mixcloud API

# Rate Limiting
DEFAULT_RATE_LIMIT_DELAY = 1.0  # seconds between API requests
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF_FACTOR = 2.0

# File Paths
DEFAULT_OUTPUT_FILE = "shows.json"
DEFAULT_CONFIG_FILE = "indexer/config.json"

# Categories
DEFAULT_CATEGORY = "Sans catégorie"

# JSON Configuration
JSON_INDENT = 2

# Exit Codes
EXIT_SUCCESS = 0
EXIT_CONFIG_ERROR = 1
EXIT_FETCH_ERROR = 2
EXIT_PROCESSING_ERROR = 3
EXIT_IO_ERROR = 4

# Logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
