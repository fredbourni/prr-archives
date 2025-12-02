"""Main entry point for the Mixcloud show indexer.

This script fetches shows from Mixcloud, categorizes them based on configured
patterns, and saves the results to a JSON file. It supports incremental updates
and local-only category updates.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import List, Set

from constants import (
    DEFAULT_CONFIG_FILE,
    DEFAULT_OUTPUT_FILE,
    EXIT_CONFIG_ERROR,
    EXIT_FETCH_ERROR,
    EXIT_IO_ERROR,
    EXIT_PROCESSING_ERROR,
    EXIT_SUCCESS,
    JSON_INDENT,
    LOG_DATE_FORMAT,
    LOG_FORMAT,
)
from fetcher import MixcloudFetcher
from processor import DataProcessor
from indexer_types import (
    ConfigError,
    FetchError,
    IndexerError,
    ProcessedShow,
    ProcessingError,
)


logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False) -> None:
    """Configure logging for the application.
    
    Args:
        verbose: If True, set log level to DEBUG, otherwise INFO.
    """
    level = logging.DEBUG if verbose else logging.INFO
    
    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT,
        stream=sys.stderr,
    )
    
    # Reduce noise from urllib3
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def load_existing_index(path: Path) -> List[ProcessedShow]:
    """Load existing show index from JSON file.
    
    Args:
        path: Path to the JSON index file.
    
    Returns:
        List of existing shows, or empty list if file doesn't exist or is invalid.
    """
    if not path.exists():
        logger.info(f"No existing index found at {path}")
        return []
    
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            logger.warning(
                f"Invalid index file format (expected list, got {type(data).__name__}). "
                "Starting with empty index."
            )
            return []
        
        logger.info(f"Loaded {len(data)} existing shows from {path}")
        return data
        
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse existing index {path}: {e}. Starting fresh.")
        return []
    except IOError as e:
        logger.warning(f"Failed to read existing index {path}: {e}. Starting fresh.")
        return []


def save_index(path: Path, data: List[ProcessedShow]) -> None:
    """Save show index to JSON file.
    
    Shows are sorted by created_time in descending order before saving.
    
    Args:
        path: Path to save the JSON file.
        data: List of processed shows to save.
    
    Raises:
        IOError: If the file cannot be written.
    """
    # Sort by created_time descending (newest first)
    sorted_data = sorted(
        data,
        key=lambda x: x.get("created_time", ""),
        reverse=True,
    )
    
    # Ensure parent directory exists
    path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with path.open("w", encoding="utf-8") as f:
            json.dump(sorted_data, f, indent=JSON_INDENT, ensure_ascii=False)
        
        logger.info(f"Saved {len(sorted_data)} shows to {path}")
        
    except IOError as e:
        error_msg = f"Failed to write index to {path}: {e}"
        logger.error(error_msg)
        raise


def perform_local_update(
    output_path: Path,
    processor: DataProcessor,
) -> int:
    """Update categories and tags locally without fetching from API.
    
    Args:
        output_path: Path to the shows index file.
        processor: Data processor for categorization.
    
    Returns:
        Exit code (0 for success, non-zero for error).
    """
    logger.info("Starting local update mode")
    
    existing_data = load_existing_index(output_path)
    
    if not existing_data:
        logger.warning("No existing data to update")
        return EXIT_SUCCESS
    
    updated_count = 0
    
    for show in existing_data:
        old_category = show.get("category")
        old_tags = set(show.get("tags", []))
        
        # Get new category and extra tags
        new_category, extra_tags = processor.get_category_info(show.get("name", ""))
        
        # Update category if changed
        if old_category != new_category:
            show["category"] = new_category
            updated_count += 1
            logger.info(f"Updated category: {show['name']} -> {new_category}")
        
        # Update tags: combine existing, extra, and normalize
        current_tags = show.get("tags", [])
        new_tags = processor.normalize_tags(current_tags + extra_tags)
        
        # Check if tags changed (compare sorted lists)
        # Note: current_tags might not be sorted or unique, so we normalize it for comparison
        # But actually we just want to know if the result is different from what we have
        if new_tags != sorted(list(set(current_tags))):
            show["tags"] = new_tags
            updated_count += 1
            logger.info(
                f"Updated tags: {show['name']} -> {len(new_tags)} tags"
            )


    
    if updated_count > 0:
        logger.info(f"Updated {updated_count} shows")
        try:
            save_index(output_path, existing_data)
        except IOError:
            return EXIT_IO_ERROR
    else:
        logger.info("No updates needed")
    
    return EXIT_SUCCESS


def perform_fetch_and_index(
    output_path: Path,
    config_path: Path,
    limit: int | None = None,
) -> int:
    """Fetch new shows from API and update the index.
    
    Args:
        output_path: Path to the shows index file.
        config_path: Path to the configuration file.
        limit: Maximum number of shows to fetch (for testing).
    
    Returns:
        Exit code (0 for success, non-zero for error).
    """
    logger.info("Starting fetch and index mode")
    
    # Load existing data
    existing_data = load_existing_index(output_path)
    existing_ids: Set[str] = {show["key"] for show in existing_data}
    
    # Initialize components
    try:
        processor = DataProcessor(str(config_path))
        fetcher = MixcloudFetcher()
    except ConfigError as e:
        logger.error(f"Configuration error: {e}")
        return EXIT_CONFIG_ERROR
    
    new_shows: List[ProcessedShow] = []
    
    # Fetch and process shows
    try:
        for raw_show in fetcher.fetch_shows(limit=limit, existing_ids=existing_ids):
            try:
                processed_show = processor.process_show(raw_show)
                new_shows.append(processed_show)
                logger.info(f"Indexed: {processed_show['name']}")
            except ProcessingError as e:
                logger.error(f"Failed to process show: {e}")
                # Continue with other shows
                continue
                
    except FetchError as e:
        logger.error(f"Fetch error: {e}")
        return EXIT_FETCH_ERROR
    
    # Save results
    if new_shows:
        logger.info(f"Found {len(new_shows)} new shows")
        all_shows = new_shows + existing_data
        
        try:
            save_index(output_path, all_shows)
        except IOError:
            return EXIT_IO_ERROR
    else:
        logger.info("No new shows found")
    
    return EXIT_SUCCESS


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments.
    
    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        description="Mixcloud Show Indexer - Fetch and categorize shows",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch all new shows
  %(prog)s
  
  # Fetch up to 10 shows (for testing)
  %(prog)s --limit 10
  
  # Update categories locally without fetching
  %(prog)s --local-update
  
  # Use custom paths
  %(prog)s --output data/shows.json --config data/config.json
  
  # Enable verbose logging
  %(prog)s --verbose
        """,
    )
    
    parser.add_argument(
        "--limit",
        type=int,
        metavar="N",
        help="Limit number of shows to fetch (for testing)",
    )
    
    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT_FILE,
        metavar="PATH",
        help=f"Output JSON file path (default: {DEFAULT_OUTPUT_FILE})",
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default=DEFAULT_CONFIG_FILE,
        metavar="PATH",
        help=f"Path to config file (default: {DEFAULT_CONFIG_FILE})",
    )
    
    parser.add_argument(
        "--local-update",
        action="store_true",
        help="Update categories locally without fetching from API",
    )
    
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose (DEBUG) logging",
    )
    
    return parser.parse_args()


def main() -> int:
    """Main entry point for the indexer.
    
    Returns:
        Exit code (0 for success, non-zero for error).
    """
    args = parse_arguments()
    setup_logging(verbose=args.verbose)
    
    logger.info("=" * 60)
    logger.info("Mixcloud Show Indexer")
    logger.info("=" * 60)
    
    output_path = Path(args.output)
    config_path = Path(args.config)
    
    # Validate config file exists
    if not config_path.exists():
        logger.error(f"Configuration file not found: {config_path}")
        return EXIT_CONFIG_ERROR
    
    try:
        if args.local_update:
            # Local update mode
            processor = DataProcessor(str(config_path))
            return perform_local_update(output_path, processor)
        else:
            # Fetch and index mode
            return perform_fetch_and_index(output_path, config_path, args.limit)
            
    except IndexerError as e:
        logger.error(f"Indexer error: {e}")
        return EXIT_PROCESSING_ERROR
    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        return EXIT_SUCCESS
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return EXIT_PROCESSING_ERROR


if __name__ == "__main__":
    sys.exit(main())
