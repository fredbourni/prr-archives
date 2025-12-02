"""Data processor for categorizing and cleaning Mixcloud show data."""

import json
import logging
import re
from pathlib import Path
from typing import List, Tuple, Dict, Any, Pattern, Optional

from constants import DEFAULT_CATEGORY, JSON_INDENT
from indexer_types import (
    ConfigData,
    ConfigError,
    ProcessedShow,
    ProcessingError,
    RawShowData,
    ShowPattern,
    ValidationError,
)


logger = logging.getLogger(__name__)


class CompiledPattern:
    """Compiled regex pattern with associated metadata.
    
    Attributes:
        name: Category name for shows matching this pattern.
        regex: Compiled regular expression pattern.
        extra_tags: Additional tags to add to matching shows.
    """
    
    def __init__(self, name: str, regex: Pattern[str], extra_tags: List[str]) -> None:
        """Initialize a compiled pattern.
        
        Args:
            name: Category name.
            regex: Compiled regex pattern.
            extra_tags: List of additional tags.
        """
        self.name = name
        self.regex = regex
        self.extra_tags = extra_tags


class DataProcessor:
    """Processes and categorizes Mixcloud show data.
    
    This class loads configuration, compiles regex patterns, and processes
    raw show data into a structured format with categories and tags.
    
    Attributes:
        config: Loaded configuration data.
        patterns: List of compiled regex patterns for categorization.
    """
    
    def __init__(self, config_path: str) -> None:
        """Initialize the data processor.
        
        Args:
            config_path: Path to the JSON configuration file.
        
        Raises:
            ConfigError: If the configuration file cannot be loaded or is invalid.
        """
        self.config = self._load_config(config_path)
        self.tag_mappings = self.config.get("tag_mappings", {})
        self.patterns = self._compile_patterns()
        
        logger.info(
            f"Initialized DataProcessor with {len(self.patterns)} patterns "
            f"and {len(self.tag_mappings)} tag mappings from {config_path}"
        )
    
    def _load_config(self, path: str) -> ConfigData:
        """Load and validate configuration from JSON file.
        
        Args:
            path: Path to the configuration file.
        
        Returns:
            Loaded configuration data.
        
        Raises:
            ConfigError: If the file cannot be read or contains invalid JSON.
        """
        config_file = Path(path)
        
        if not config_file.exists():
            error_msg = f"Configuration file not found: {path}"
            logger.error(error_msg)
            raise ConfigError(error_msg)
        
        try:
            with config_file.open("r", encoding="utf-8") as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in configuration file {path}: {e}"
            logger.error(error_msg)
            raise ConfigError(error_msg) from e
        except IOError as e:
            error_msg = f"Failed to read configuration file {path}: {e}"
            logger.error(error_msg)
            raise ConfigError(error_msg) from e
        
        # Validate configuration structure
        if not isinstance(config, dict):
            error_msg = f"Configuration must be a JSON object, got {type(config).__name__}"
            logger.error(error_msg)
            raise ConfigError(error_msg)
        
        if "shows" not in config:
            error_msg = "Configuration must contain 'shows' array"
            logger.error(error_msg)
            raise ConfigError(error_msg)
        
        if not isinstance(config["shows"], list):
            error_msg = f"'shows' must be an array, got {type(config['shows']).__name__}"
            logger.error(error_msg)
            raise ConfigError(error_msg)
        
        logger.debug(f"Loaded configuration with {len(config['shows'])} show patterns")
        return config
    
    def _compile_patterns(self) -> List[CompiledPattern]:
        """Compile regex patterns from configuration.
        
        Returns:
            List of compiled patterns with metadata.
        
        Raises:
            ConfigError: If a regex pattern is invalid.
        """
        patterns: List[CompiledPattern] = []
        
        for idx, show_config in enumerate(self.config.get("shows", [])):
            # Validate show configuration
            if not isinstance(show_config, dict):
                logger.warning(f"Skipping invalid show config at index {idx}: not a dict")
                continue
            
            name = show_config.get("name")
            regex_str = show_config.get("regex")
            
            if not name or not regex_str:
                logger.warning(
                    f"Skipping show config at index {idx}: "
                    f"missing 'name' or 'regex'"
                )
                continue
            
            try:
                compiled_regex = re.compile(regex_str, re.IGNORECASE)
                extra_tags = show_config.get("extra_tags", [])
                
                # Validate extra_tags is a list
                if not isinstance(extra_tags, list):
                    logger.warning(
                        f"Invalid extra_tags for '{name}': expected list, "
                        f"got {type(extra_tags).__name__}. Using empty list."
                    )
                    extra_tags = []
                
                patterns.append(CompiledPattern(name, compiled_regex, extra_tags))
                logger.debug(f"Compiled pattern for category '{name}'")
                
            except re.error as e:
                error_msg = f"Invalid regex for '{name}': {e}"
                logger.error(error_msg)
                raise ConfigError(error_msg) from e
        
        logger.info(f"Successfully compiled {len(patterns)} patterns")
        return patterns
    
    def get_category_info(self, title: str) -> Tuple[str, List[str]]:
        """Determine category and extra tags for a show title.
        
        Matches the title against configured regex patterns to determine
        the appropriate category and any additional tags.
        
        Args:
            title: Show title to categorize.
        
        Returns:
            Tuple of (category_name, extra_tags). Returns default category
            and empty tags list if no pattern matches.
        """
        if not title:
            logger.debug("Empty title provided, using default category")
            return DEFAULT_CATEGORY, []
        
        for pattern in self.patterns:
            if pattern.regex.search(title):
                logger.debug(
                    f"Title '{title}' matched category '{pattern.name}' "
                    f"with {len(pattern.extra_tags)} extra tags"
                )
                return pattern.name, pattern.extra_tags
        
        logger.debug(f"No pattern matched for title '{title}', using default category")
        return DEFAULT_CATEGORY, []
    
    def _validate_raw_show(self, raw_data: Dict[str, Any]) -> None:
        """Validate that raw show data has required fields.
        
        Args:
            raw_data: Raw show data from API.
        
        Raises:
            ValidationError: If required fields are missing.
        """
        required_fields = ["key", "name", "slug", "url"]
        missing_fields = [field for field in required_fields if field not in raw_data]
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            raise ValidationError(error_msg)

    def _normalize_text(self, text: str) -> str:
        """Remove non-word characters for comparison.
        
        Args:
            text: Text to normalize.
            
        Returns:
            Normalized text with only alphanumeric characters in lowercase.
        """
        if not text:
            return ""
        return re.sub(r'[^\w]', '', text).lower()
    
    def normalize_tag(self, tag: str) -> str:
        """Normalize a tag using configured mappings.
        
        Args:
            tag: The tag to normalize.
            
        Returns:
            The normalized tag (or original if no mapping exists).
        """
        if not tag:
            return tag
            
        # Check for case-insensitive match in mappings
        tag_lower = tag.lower()
        for key, value in self.tag_mappings.items():
            if key.lower() == tag_lower:
                return value
                
        return tag

    def normalize_tags(self, tags: List[str]) -> List[str]:
        """Normalize a list of tags.
        
        Args:
            tags: List of tags to normalize.
            
        Returns:
            List of normalized tags (unique and sorted).
        """
        normalized_set = set()
        for tag in tags:
            normalized_set.add(self.normalize_tag(tag))
        return sorted(list(normalized_set))

    def _extract_picture_key(self, pictures: Dict[str, str]) -> str:
        """Extract picture key (suffix) from picture URLs.
        
        Args:
            pictures: Dictionary of picture URLs.
            
        Returns:
            The extracted key string (e.g. 'extaudio/.../uuid'), or empty string.
        """
        # Try to get any URL to extract the key
        # The URL format is: 
        # https://thumbnailer.mixcloud.com/unsafe/WxH/KEY
        # We want the KEY part (everything after the size)
        
        for key in ["large", "medium", "small", "thumbnail"]:
            url = pictures.get(key)
            if url:
                try:
                    # Split by 'unsafe/'
                    parts = url.split("unsafe/")
                    if len(parts) > 1:
                        # The part after unsafe/ starts with size/
                        # e.g. 300x300/extaudio/...
                        suffix = parts[1]
                        # Split by first / to remove size
                        path_parts = suffix.split("/", 1)
                        if len(path_parts) > 1:
                            return path_parts[1]
                except (AttributeError, IndexError):
                    continue
                    
        return ""

    def process_show(self, raw_data: RawShowData) -> ProcessedShow:
        """Process and categorize a single show.
        
        Extracts relevant fields, determines category, merges tags,
        and returns a cleaned, structured show object.
        
        Args:
            raw_data: Raw show data from Mixcloud API.
        
        Returns:
            Processed show data with category and merged tags.
        
        Raises:
            ProcessingError: If processing fails.
            ValidationError: If required fields are missing.
        """
        try:
            # Validate required fields
            self._validate_raw_show(raw_data)
            
            # Extract and clean title
            title = raw_data.get("name", "").strip()
            
            # Determine category and extra tags
            category, extra_tags = self.get_category_info(title)
            
            # Extract existing tags from API response
            existing_tags: List[str] = []
            raw_tags = raw_data.get("tags", [])
            
            if isinstance(raw_tags, list):
                for tag in raw_tags:
                    if isinstance(tag, dict) and "name" in tag:
                        tag_name = tag["name"]
                        if isinstance(tag_name, str):
                            existing_tags.append(tag_name)
            
            # Merge tags (unique values only) and normalize
            all_tags = self.normalize_tags(existing_tags + extra_tags)
            
            # Build processed show object
            processed: ProcessedShow = {
                "name": title,
                "slug": raw_data["slug"],
                "created_time": raw_data.get("created_time", ""),
                "picture_key": self._extract_picture_key(raw_data.get("pictures", {})),
                "tags": all_tags,
                "category": category,
                "audio_length": raw_data.get("audio_length", 0),
            }
            
            # Add description only if it differs significantly from the title
            description = raw_data.get("description", "")
            if description:
                norm_title = self._normalize_text(title)
                norm_desc = self._normalize_text(description)
                
                if norm_title != norm_desc:
                    processed["description"] = description
            
            logger.debug(
                f"Processed show '{title}' -> category '{category}' "
                f"with {len(all_tags)} tags"
            )
            
            return processed
            
        except (ValidationError, KeyError) as e:
            error_msg = f"Failed to process show: {e}"
            logger.error(error_msg)
            raise ProcessingError(error_msg) from e
