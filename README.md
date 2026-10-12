# PRR Archives

A static web application and indexing system to browse, search, and listen to 3000+ archived shows from [PunkRockRadio.ca](https://punkrockradio.ca) on Mixcloud.

To load the application: [https://fredbourni.github.io/prr-archives/](https://fredbourni.github.io/prr-archives/)

## Overview

This project provides a comprehensive archive browser for PunkRockRadio.ca shows, consisting of two main components:

1.  **Indexer (Python)**: Fetches show data from the Mixcloud API, categorizes shows using regex patterns, normalizes tags, and generates a static JSON index with incremental update support.
2.  **Web Application (React + TypeScript + Vite)**: A responsive web interface featuring fuzzy search, advanced filtering, infinite scroll, permalink support, and an embedded Mixcloud player with playback tracking.

## Features

### Indexer Features

The Python indexer efficiently manages the show database through incremental updates, only fetching new content while respecting Mixcloud's API rate limits with automatic retry logic. It automatically categorizes shows into 30+ categories using regex patterns and normalizes tags through configurable mappings. A local update mode allows re-categorization without API calls.

### Web Application Features

- **Fuzzy Search**: Fuse.js-powered search across titles, tags, categories, and descriptions with typo tolerance
- **Advanced Filtering**: Text search, year/category/tag filters (multi-select with intersection matching), recently-played filter, and combined filter support
- **Statistics Dashboard**: Accessible via `?stats=1` with period selector, trends chart (episodes & minutes over time), and clickable category cards
- **Playback Features**: Embedded Mixcloud player with resume playback, progress tracking (throttled saves), shuffle button, and recently-played history (up to 20 episodes with progress indicators)
- **Navigation & UX**: Infinite scroll, sort by date, back-to-top button, permalink sharing with full state sync
- **Design**: Responsive Material-UI, dark theme with glassmorphism, SEO optimized with Open Graph tags and auto-generated sitemap

## Project Structure

```
./
├── indexer/                # Python indexing scripts and config
├── web/                    # React web application, build scripts and show index
├── .github/workflows/      # GitHub Actions
```

## Prerequisites

- **Python**: 3.10 or later (for the indexer)
- **Node.js**: 20.x or later (for the web app)
- **npm**: Comes with Node.js

## Installation & Usage

### 1. Indexer Setup

The indexer fetches and processes show data from Mixcloud.

1.  Navigate to the project root.
2.  Install the required Python dependencies:
    ```bash
    pip install requests
    ```
3.  Run the indexer:
    ```bash
    # Fetch all shows (incremental update if shows.json exists)
    python indexer/main.py --output web/public/shows.json

    # Fetch a limited number of shows (useful for testing)
    python indexer/main.py --limit 10

    # Update categories/tags locally without fetching from API
    python indexer/main.py --local-update --output web/public/shows.json

    # Enable verbose logging for debugging
    python indexer/main.py --verbose

    # Use custom configuration file
    python indexer/main.py --config custom_config.json
    ```

### 2. Web Application Setup

The web application provides the user interface for browsing shows.

1.  Navigate to the `web` directory:
    ```bash
    cd web
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Generate the index file with the info fetched from mixcloud and saved in the web public folder:
    ```bash
    python indexer/main.py --output web/public/shows.json
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

5.  **Additional Commands**:
    ```bash
    # Build for production
    npm run build

    # Preview production build
    npm run preview

    # Run linter
    npm run lint

    # Format code
    npm run format

    # Check formatting
    npm run format:check

    # Type check
    npm run type-check
    ```

## Configuration

### Show Categorization

Shows are categorized using regex patterns defined in `indexer/config.json`. The indexer matches show titles against these patterns to assign categories (shows).

**Example configuration:**

```json
{
    "shows": [
        {
            "name": "Le Pink Punk Show",
            "regex": "P.nk[ ]+P.nk"
        },
        {
            "name": "Esprit de Core",
            "regex": "esprit.*core",
            "extra_tags": [
                "Metalcore",
                "Post-Hardcore",
                "Hardcore punk"
            ]
        },
        {
            "name": "Shows Spéciaux",
            "regex": "(sp.cial|entrevue|interview|jasette|impro|dimanche)"
        }
    ],
    "tag_mappings": {
        "Hardcore punk": "Hardcore",
        "Ska": "Ska punk"
    }
}
```

**Configuration Options:**
- **`shows`**: Array of show patterns
  - **`name`**: Display name for the category
  - **`regex`**: Regular expression to match show titles (case-insensitive)
  - **`extra_tags`** (optional): Additional tags to add to matching shows
- **`tag_mappings`**: Tag normalization rules (maps source tag → normalized tag)

### Adding New Show Categories

1. Edit `indexer/config.json`
2. Add a new entry to the `shows` array with a unique regex pattern
3. Run the indexer with `--local-update` to update existing shows:
   ```bash
   python indexer/main.py --local-update --output web/public/shows.json
   ```

## API Integration

The indexer fetches show data from Mixcloud API (`punkrockradio` user) with 1-second delays between requests and 3-retry exponential backoff.

## Automation

**Daily Index Updates** (`.github/workflows/update_index.yml`):
- Runs daily at 11 AM & 11 PM UTC (weekdays only)
- Performs incremental updates, commits changes if detected
- Can be manually triggered with optional `--force-reindex` flag

## Development

### Code Quality Tools

Run quality checks:
```bash
cd web
npm run lint          # Check for linting errors
npm run format        # Auto-format code
npm run format:check  # Verify formatting
npm run type-check    # TypeScript validation
```
