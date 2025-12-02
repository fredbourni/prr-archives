"""Mixcloud API fetcher with rate limiting and error handling."""

import logging
import time
from typing import Iterator, Optional, Set, Dict, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from constants import (
    MIXCLOUD_BASE_URL,
    MIXCLOUD_USER,
    API_PAGE_SIZE,
    DEFAULT_RATE_LIMIT_DELAY,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
)
from indexer_types import FetchError, RawShowData


logger = logging.getLogger(__name__)


class MixcloudFetcher:
    """Fetches show data from the Mixcloud API with rate limiting and retry logic.
    
    This class handles pagination, rate limiting, and incremental updates by
    tracking already-indexed shows.
    
    Attributes:
        base_url: Base URL for the Mixcloud API.
        user: Mixcloud username to fetch shows from.
        rate_limit_delay: Delay in seconds between API requests.
        session: Requests session with retry configuration.
    """
    
    def __init__(
        self,
        user: str = MIXCLOUD_USER,
        base_url: str = MIXCLOUD_BASE_URL,
        rate_limit_delay: float = DEFAULT_RATE_LIMIT_DELAY,
    ) -> None:
        """Initialize the Mixcloud fetcher.
        
        Args:
            user: Mixcloud username to fetch shows from.
            base_url: Base URL for the Mixcloud API.
            rate_limit_delay: Delay in seconds between API requests to respect rate limits.
        """
        self.base_url = base_url
        self.user = user
        self.rate_limit_delay = rate_limit_delay
        self.session = self._create_session()
        
        logger.info(
            f"Initialized MixcloudFetcher for user '{user}' "
            f"with {rate_limit_delay}s rate limit delay"
        )
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry configuration.
        
        Returns:
            Configured requests Session with retry logic.
        """
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=MAX_RETRIES,
            backoff_factor=RETRY_BACKOFF_FACTOR,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"],
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def fetch_shows(
        self,
        limit: Optional[int] = None,
        existing_ids: Optional[Set[str]] = None,
    ) -> Iterator[RawShowData]:
        """Fetch shows from Mixcloud API with pagination and rate limiting.
        
        This method yields shows one at a time, handling pagination automatically.
        It stops early if a show is found in existing_ids (incremental update) or
        if the limit is reached.
        
        Args:
            limit: Maximum number of shows to fetch. None means fetch all.
            existing_ids: Set of show keys that are already indexed. If a show
                with a key in this set is encountered, fetching stops early
                (incremental update optimization).
        
        Yields:
            Raw show data dictionaries from the Mixcloud API.
        
        Raises:
            FetchError: If the API request fails or returns invalid data.
        """
        if existing_ids is None:
            existing_ids = set()
        
        url = f"{self.base_url}/{self.user}/cloudcasts/"
        params: Dict[str, Any] = {"limit": API_PAGE_SIZE}
        count = 0
        page_num = 0
        
        logger.info(f"Starting to fetch shows (limit: {limit or 'unlimited'})")
        
        while url:
            page_num += 1
            logger.debug(f"Fetching page {page_num}: {url}")
            
            try:
                response = self.session.get(
                    url,
                    params=params,
                    timeout=REQUEST_TIMEOUT,
                )
                response.raise_for_status()
                data = response.json()
            except requests.exceptions.Timeout as e:
                error_msg = f"Request timeout while fetching page {page_num}: {e}"
                logger.error(error_msg)
                raise FetchError(error_msg) from e
            except requests.exceptions.HTTPError as e:
                error_msg = f"HTTP error {response.status_code} on page {page_num}: {e}"
                logger.error(error_msg)
                raise FetchError(error_msg) from e
            except requests.exceptions.RequestException as e:
                error_msg = f"Request failed on page {page_num}: {e}"
                logger.error(error_msg)
                raise FetchError(error_msg) from e
            except ValueError as e:
                error_msg = f"Invalid JSON response on page {page_num}: {e}"
                logger.error(error_msg)
                raise FetchError(error_msg) from e
            
            # Validate response structure
            if not isinstance(data, dict):
                error_msg = f"Expected dict response, got {type(data).__name__}"
                logger.error(error_msg)
                raise FetchError(error_msg)
            
            shows = data.get("data", [])
            if not isinstance(shows, list):
                error_msg = f"Expected list in 'data' field, got {type(shows).__name__}"
                logger.error(error_msg)
                raise FetchError(error_msg)
            
            logger.info(f"Page {page_num}: Retrieved {len(shows)} shows")
            
            for show in shows:
                # Check if we've reached the limit
                if limit is not None and count >= limit:
                    logger.info(f"Reached limit of {limit} shows")
                    return
                
                # Check if we already have this show (incremental update)
                show_key = show.get("key")
                if show_key in existing_ids:
                    logger.info(
                        f"Found existing show '{show_key}', "
                        "stopping incremental fetch"
                    )
                    return
                
                # Fetch full show details to get description
                try:
                    detail_url = f"{self.base_url}{show_key}"
                    logger.debug(f"Fetching details for {show_key}")
                    detail_response = self.session.get(
                        detail_url,
                        timeout=REQUEST_TIMEOUT
                    )
                    detail_response.raise_for_status()
                    full_show = detail_response.json()
                    yield full_show
                    
                    # Rate limiting for detail requests
                    time.sleep(self.rate_limit_delay)
                    
                except requests.exceptions.RequestException as e:
                    logger.error(f"Failed to fetch details for {show_key}: {e}")
                    # Yield the summary data as fallback, or skip?
                    # Let's yield summary but log error. Description will be missing.
                    yield show
                
                count += 1
            
            # Handle pagination
            paging = data.get("paging", {})
            url = paging.get("next")
            params = {}  # Next URL contains all necessary params
            
            # Rate limiting - sleep before next request
            if url:
                logger.debug(f"Rate limiting: sleeping {self.rate_limit_delay}s")
                time.sleep(self.rate_limit_delay)
        
        logger.info(f"Completed fetching. Total shows retrieved: {count}")
