# api-ex - API Explorer CLI

A fast, developer-friendly CLI for exploring and testing REST and GraphQL APIs from the terminal.

## Features

- Send HTTP requests with any method (GET, POST, PUT, PATCH, DELETE, etc.)
- Save and reuse requests with environment variable interpolation
- Manage multiple environments (dev, staging, production)
- Execute GraphQL queries and mutations
- Track request history with filtering
- Input validation and helpful error messages
- Debug mode for troubleshooting

## Installation

```bash
# Install globally
npm install -g api-ex

# Or use with npx (no installation required)
npx api-ex

# Verify installation
api-ex --version
```

## Quick Start

```bash
# Send a simple GET request
api-ex request --url https://jsonplaceholder.typicode.com/posts/1

# Save a request for reuse
api-ex save get-user --url https://api.example.com/users/1 --method GET

# Create an environment
api-ex env add production BASE_URL=https://api.example.com API_KEY=secret123

# Run saved request with environment
api-ex run get-user --env production

# View request history
api-ex history
```

## Commands

### `api-ex request`
Send ad-hoc HTTP requests.

```bash
api-ex request --url <url> [options]

Options:
  -X, --method <method>    HTTP method (default: GET)
  -H, --header <header>    Add header (repeatable)
  -d, --data <data>        Request body
  -t, --timeout <ms>       Request timeout (default: 30000)
  --env <name>             Use environment for interpolation
```

**Examples:**
```bash
# GET request
api-ex request --url https://api.example.com/users

# POST with JSON body
api-ex request --url https://api.example.com/users \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{"name": "John", "email": "john@example.com"}'

# With environment variables
api-ex request --url "{{BASE_URL}}/users" --env production
```

### `api-ex save <name>`
Save a request for later reuse.

```bash
api-ex save <name> --url <url> [options]

Options:
  -X, --method <method>    HTTP method (default: GET)
  -H, --header <header>    Add header (repeatable)
  -d, --data <data>        Request body
```

**Examples:**
```bash
# Save a simple GET request
api-ex save list-users --url https://api.example.com/users

# Save POST request with headers
api-ex save create-user \
  --url "{{BASE_URL}}/users" \
  --method POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer {{TOKEN}}" \
  --data '{"name": "{{USER_NAME}}"}'
```

### `api-ex run <name>`
Execute a saved request.

```bash
api-ex run <name> [options]

Options:
  --env <name>             Environment for interpolation
  -H, --header <header>    Override headers (repeatable)
  -d, --data <data>        Override request body
```

**Examples:**
```bash
# Run saved request
api-ex run list-users

# With environment
api-ex run create-user --env development

# Override headers
api-ex run get-user --header "Authorization: Bearer new-token"
```

### `api-ex ls`
List all saved requests.

```bash
api-ex ls [options]

Options:
  -v, --verbose            Show detailed information
  --filter <text>          Filter by name
```

**Examples:**
```bash
# List all requests
api-ex ls

# Verbose mode with details
api-ex ls --verbose

# Filter by name
api-ex ls --filter user
```

### `api-ex env`
Manage environments.

```bash
# Add/update environment
api-ex env add <name> <KEY=value>...

# List environments
api-ex env list
api-ex env ls

# Remove environment
api-ex env rm <name>
api-ex env remove <name>
```

**Examples:**
```bash
# Create development environment
api-ex env add dev \
  BASE_URL=http://localhost:3000 \
  API_KEY=dev-key \
  DEBUG=true

# Create production environment
api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=prod-secret-key

# List all environments
api-ex env list

# Remove an environment
api-ex env rm staging
```

### `api-ex gql`
Send GraphQL queries and mutations.

```bash
api-ex gql <url> [options]

Options:
  -q, --query <query>      Inline GraphQL query
  -f, --file <file>        Load query from file
  -v, --variables <json>   Query variables as JSON
  -H, --header <header>    Add header (repeatable)
  --env <name>             Use environment for interpolation
```

**Examples:**
```bash
# Inline query
api-ex gql https://api.example.com/graphql \
  --query "{ users { id name email } }"

# Query from file with variables
api-ex gql https://api.example.com/graphql \
  --file queries/getUser.graphql \
  --variables '{"id": "123"}'

# With authentication
api-ex gql "{{BASE_URL}}/graphql" \
  --query "mutation { createUser(name: \"John\") { id } }" \
  --header "Authorization: Bearer {{TOKEN}}" \
  --env production
```

### `api-ex history`
View request history.

```bash
api-ex history [options]

Options:
  -n, --limit <number>     Number of entries (default: 10)
  --method <method>        Filter by HTTP method
  --status <code>          Filter by status code
```

**Examples:**
```bash
# View last 10 requests
api-ex history

# View last 20 requests
api-ex history --limit 20

# Filter by method
api-ex history --method POST

# Filter by status
api-ex history --status 200
```

## Environment Variables

### Interpolation Syntax

Use `{{VARIABLE_NAME}}` placeholders in URLs, headers, and request bodies:

```bash
# In URLs
--url "{{BASE_URL}}/api/v1/users/{{USER_ID}}"

# In headers
--header "Authorization: Bearer {{API_TOKEN}}"

# In request body
--data '{"apiKey": "{{API_KEY}}", "user": "{{USER_NAME}}"}'
```

### System Environment Variables

- `API_EX_DEBUG=1` - Enable debug mode globally
- `API_EX_STORAGE_DIR` - Custom storage directory (default: `~/.api-ex`)

## Global Options

```bash
--debug        Enable debug mode (shows request/response details)
--version      Show version number
--help         Show help
```

## Storage

API-EX stores data in `~/.api-ex/`:

- `data.json` - Saved requests and environments
- `history.json` - Request history (max 100 entries)

## Debug Mode

Enable debug mode to see detailed request information:

```bash
# Via command line flag
api-ex request --url https://api.example.com/users --debug

# Via environment variable
API_EX_DEBUG=1 api-ex run my-request
```

Debug mode shows:
- Request configuration (method, URL, headers, timeout)
- Response headers
- Environment variable interpolation

## Error Handling

API-EX provides helpful error messages:

- **Validation errors** (exit code 1): Invalid input, missing required fields
- **Runtime errors** (exit code 2): Network errors, timeouts, file system errors
- **Success** (exit code 0): Request completed successfully

Common error scenarios:
```bash
# Invalid URL
Error: Invalid URL format: not-a-url

# Network error
Network error: Unable to reach the server

# Missing environment
Error: Unknown environment 'staging'. Available: dev, production
```

## Troubleshooting

### Common Issues

**Request times out:**
```bash
# Increase timeout (in milliseconds)
api-ex request --url https://slow-api.com/data --timeout 60000
```

**Cannot reach server:**
- Check URL is correct
- Verify network connectivity
- Check if server requires VPN or proxy

**Environment variable not interpolated:**
- Ensure variable name matches exactly (case-sensitive)
- Check environment exists: `api-ex env list`
- Use debug mode to see interpolation: `--debug`

**Invalid JSON in request body:**
```bash
# Correct JSON syntax
api-ex request --data '{"key": "value"}'

# Not valid JSON (missing quotes)
api-ex request --data '{key: value}'  # Error!
```

### Reset Storage

```bash
# Remove all saved data
rm -rf ~/.api-ex

# Next command will recreate storage
api-ex env list
```

## Development

### Setup

```bash
# Clone repository
git clone <repo-url>
cd api-ex

# Install dependencies
npm install

# Test locally
node bin/api-ex --help
```

### Testing

```bash
# Run all tests (446 tests)
npm test

# Watch mode
npm run test:watch

# Coverage report (98%+ coverage)
npm run test:coverage
```

### Project Structure

```
api-ex/
├── bin/api-ex           # CLI entry point
├── src/
│   ├── index.js         # Main program setup
│   ├── commands/        # Command implementations
│   │   ├── request.js   # Ad-hoc requests
│   │   ├── save.js      # Save requests
│   │   ├── run.js       # Run saved requests
│   │   ├── ls.js        # List requests
│   │   ├── env.js       # Environment management
│   │   ├── gql.js       # GraphQL queries
│   │   └── history.js   # Request history
│   └── core/            # Core modules
│       ├── http.js      # HTTP client
│       ├── storage.js   # Data persistence
│       ├── history.js   # History tracking
│       ├── env.js       # Environment interpolation
│       ├── printer.js   # Output formatting
│       ├── debug.js     # Debug mode
│       ├── errors.js    # Custom error classes
│       └── validation.js # Input validation
├── __tests__/           # Test suites
└── docs/                # Documentation
```

## Tech Stack

- **Node.js** (>=18.0.0) - Runtime
- **commander** - CLI framework
- **axios** - HTTP client
- **chalk** - Terminal colors
- **ora** - Loading spinners
- **prettyjson** - JSON formatting
- **cli-table3** - Table output
- **lowdb** - JSON file storage
- **jest** - Testing framework

## Documentation

For more detailed documentation, see:

- [Command Reference](docs/commands.md) - Detailed command documentation
- [Environment Guide](docs/environments.md) - Working with environments
- [Usage Examples](docs/examples.md) - Real-world usage examples

## License

MIT

