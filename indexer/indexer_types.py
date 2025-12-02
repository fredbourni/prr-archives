"""Type definitions and custom exceptions for the Mixcloud indexer."""

from typing import TypedDict, Optional, List, Dict


class PicturesDict(TypedDict, total=False):
    """Mixcloud pictures data structure."""
    small: str
    medium: str
    large: str
    extra_large: str
    thumbnail: str
    medium_mobile: str


class RawShowData(TypedDict, total=False):
    """Raw show data from Mixcloud API."""
    key: str
    name: str
    slug: str
    created_time: str
    pictures: PicturesDict
    tags: List[dict]
    audio_length: int
    description: str


class ProcessedShow(TypedDict, total=False):
    """Processed show data structure for output."""
    name: str
    slug: str
    created_time: str
    picture_key: str
    tags: List[str]
    category: str
    audio_length: int
    description: str


class ShowPattern(TypedDict):
    """Show pattern configuration."""
    name: str
    regex: str
    extra_tags: List[str]


class ConfigData(TypedDict):
    """Configuration file structure."""
    shows: List[ShowPattern]
    tag_mappings: Dict[str, str]


# Custom Exceptions

class IndexerError(Exception):
    """Base exception for indexer errors."""
    pass


class ConfigError(IndexerError):
    """Raised when configuration is invalid or cannot be loaded."""
    pass


class FetchError(IndexerError):
    """Raised when fetching data from API fails."""
    pass


class ProcessingError(IndexerError):
    """Raised when processing show data fails."""
    pass


class ValidationError(IndexerError):
    """Raised when data validation fails."""
    pass
