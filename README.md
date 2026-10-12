# PRR Archives

A static web application and indexing system to browse, search, and listen to 3000+ archived shows from [PunkRockRadio.ca](https://punkrockradio.ca) on Mixcloud.

To load the application: [https://fredbourni.github.io/prr-archives/](https://fredbourni.github.io/prr-archives/)

## Overview

This project provides a comprehensive archive browser for PunkRockRadio.ca shows, consisting of two main components:

1.  **Indexer (Python)**: Fetches show data from the Mixcloud API, categorizes shows using regex patterns, normalizes tags, and generates a static JSON index with incremental update support.
2.  **Web Application (React + TypeScript + Vite)**: A responsive web interface featuring fuzzy search, advanced filtering, infinite scroll, permalink support, and an embedded Mixcloud player with playback tracking.

## Features

### Indexer Features
- **Incremental Updates**: Only fetches new shows, skipping already-indexed content for efficiency
- **Smart Rate Limiting**: 1-second delay between API requests to respect Mixcloud's rate limits
- **Robust Error Handling**: Automatic retry logic with exponential backoff for failed requests
- **Regex-Based Categorization**: Automatically categorizes shows into 30+ categories (e.g., "Le Pink Punk Show", "Esprit de Core")
- **Tag Normalization**: Merges and normalizes tags using configurable mappings (e.g., "Hardcore punk" → "Hardcore")
- **Extra Tags Support**: Add custom tags to specific shows via configuration
- **Local Update Mode**: Update categories and tags without re-fetching from API
- **Verbose Logging**: Detailed logging for debugging and monitoring

### Web Application Features
- **Fuzzy Search**: Powered by Fuse.js, searches across show titles, tags, categories, and descriptions with typo tolerance and hyphen-to-space fallback
- **Advanced Filtering**: 
  - Text search with debouncing
  - Year-based filtering
  - Category filtering with icon indicators
  - Tag filtering (multi-select autocomplete with chips; intersection matching)
  - Recently-played filter to show only listened episodes
  - Combined filter support
- **Advanced Statistics**: 
  - Comprehensive dashboard (accessible via `?stats=1`)
  - Global archive totals (episodes, minutes, hours, days, weeks, months)
  - Individual show-by-show statistics with visual indicators and clickable category cards that navigate back to the filtered show list
  - **Period Selector**: Filter stats by 1 month, 3 months, 6 months, 1 year, or all-time (`?period=`)
  - **Chart Grouping Override**: Force the trends chart to group by week or month instead of the period-derived default (`?grouping=`)
  - **Trends Chart**: Interactive dual-axis line chart plotting episodes and total minutes, grouped by week/month/year with continuous-bucket filling
- **Sort Options**: Sort by newest or oldest
- **Shuffle Button**: Pick a random show from the currently filtered results to play in the player
- **Infinite Scroll**: Smooth pagination loading 12 shows at a time
- **Permalink Support**: Share specific searches, filters, and selected shows via URL with full state synchronization (including tags and recently-played view)
- **Recently Played & Resume Playback**: Up to 20 played episodes are persisted in `localStorage` with playback position and completion status; the Mixcloud player seeks to the saved position on load so listeners resume where they left off. Progress is throttled to save at most once every 10 seconds per show
  - Progress bar and completion checkmark overlays on show cards in the recently-played view
  - Clear-history confirmation dialog
- **Embedded Mixcloud Player**: Widget integration with loading states and postMessage-based event handling (play, pause, progress, ended)
- **Back-to-Top Button**: Floating action button that appears after scrolling and smoothly returns to the top
- **Responsive Design**: Mobile-optimized Material-UI components
- **Dark Theme**: Premium Blue Gray color scheme with glassmorphism effects
- **Share Functionality**: One-click permalink copying with toast notifications
- **SEO Optimized**: Open Graph meta tags for social media previews, plus automatic sitemap.xml generation and shows.json minification at build time (limitation of a static app)

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

The indexer interacts with the Mixcloud API to fetch show data.

**API Details:**
- **Base URL**: `https://api.mixcloud.com`
- **Endpoint**: `/{username}/cloudcasts/`
- **User**: `punkrockradio`
- **Pagination**: 100 shows per page
- **Rate Limiting**: 1-second delay between requests
- **Timeout**: 30 seconds per request
- **Retry Strategy**: 3 retries with exponential backoff

### Daily Indexing Workflow

**File**: `.github/workflows/update_index.yml`

- **Schedule**: Daily at midnight UTC (`0 0 * * *`)
- **Trigger**: Can also be manually triggered via workflow_dispatch
- **Process**:
  1. Checks out repository
  2. Sets up Python 3.10
  3. Installs dependencies
  4. Runs indexer (incremental update)
  5. Commits and pushes `shows.json` if changes detected

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
