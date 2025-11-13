# api-ex - API Explorer CLI

A fast, developer-friendly CLI for exploring and testing REST and GraphQL APIs from the terminal.

## Installation

```bash
# Install globally
npm install -g api-ex

# Or use with npx (no installation required)
npx api-ex
```

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test the CLI locally
node bin/api-ex --help
```


## Commands (In Development)

- `api-ex request` - Send ad-hoc HTTP requests
- `api-ex save <name>` - Save reusable requests
- `api-ex run <name>` - Execute saved requests
- `api-ex ls` - List all saved requests
- `api-ex env` - Manage environments (add, list, remove)
- `api-ex gql` - Send GraphQL queries
- `api-ex history` - View request history

## Development Status

**Current Phase:** Phase 0 - Setup & Skeleton ✅

- [x] Initialize npm project
- [x] Install dependencies (commander, axios, chalk, ora, prettyjson, cli-table3, lowdb, jest)
- [x] Create folder structure
- [x] Create CLI entrypoint
- [x] Setup Jest configuration
- [x] Create stub files for all commands and core modules

**Next Phase:** Phase 1 - Core Engine & Storage

See [apix-prd.md](apix-prd.md) for the complete Product Requirements Document.

## Tech Stack

- **Node.js** - Runtime (>=18.0.0)
- **commander** - CLI framework
- **axios** - HTTP client
- **chalk** - Terminal colors
- **ora** - Loading spinners
- **prettyjson** - JSON formatting
- **cli-table3** - Table output
- **lowdb** - JSON storage
- **jest** - Testing framework


