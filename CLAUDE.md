# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an HTML Page Manager application that allows users to upload, manage, and preview HTML files through a web interface. The application consists of both client-side and server-side components.

## Architecture

The project has a hybrid architecture:

1. **Main Application (Client-side)**: A single-page application built with vanilla JavaScript that manages HTML file uploads, storage in localStorage, and preview functionality
2. **Development Server (Server-side)**: A simple Node.js HTTP server for local development
3. **Static Files**: HTML, CSS, and JavaScript files served statically

### Core Components

- **HTMLPageManager Class** (`script.js:1-260`): Main application logic handling file uploads, drag & drop, modal management, and localStorage persistence
- **Upload System**: Drag & drop interface with file validation for HTML files only
- **Storage System**: Uses localStorage to persist uploaded HTML files with metadata (name, size, upload date)
- **Preview System**: Modal-based HTML preview using blob URLs for secure rendering
- **Card-based UI**: Grid layout displaying uploaded files with metadata

### Key Files

- `index.html`: Main application interface with German UI
- `script.js`: Core application logic (HTMLPageManager class)
- `styles.css`: Application styling (exists but not analyzed)
- `server.js`: Simple Node.js development server
- `SurveyGraph.html`: Standalone D3.js organizational graph visualization
- `package.json`: Project configuration and scripts

## Development Commands

### Running the Application

```bash
# Development server (Node.js)
npm run dev

# Alternative static server (Python)
npm start

# Note: No build step required
npm run build
```

### Server Details

The Node.js development server (`server.js`) runs on port 3000 and serves static files with proper MIME types for HTML, CSS, JS, and JSON files.

## Code Conventions

- German language UI and variable names throughout the application
- Vanilla JavaScript (ES6+ class syntax)
- localStorage for data persistence
- Blob URLs for secure HTML preview
- Event-driven architecture with comprehensive error handling

## Data Storage

The application stores uploaded HTML files in localStorage under the key `htmlPageManager_pages`. Each page object contains:
- `id`: Unique identifier
- `name`: Original filename
- `content`: Full HTML content
- `size`: File size in bytes
- `uploadDate`: ISO timestamp
- `lastModified`: File modification timestamp

## Security Considerations

The application uses blob URLs for HTML preview to provide isolation and prevent XSS attacks when displaying user-uploaded HTML content.