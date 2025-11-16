# Command Reference

Complete reference for all API-EX commands.

## Table of Contents

- [request](#request) - Send HTTP requests
- [save](#save) - Save requests
- [run](#run) - Execute saved requests
- [ls](#ls) - List saved requests
- [env](#env) - Manage environments
- [gql](#gql) - GraphQL queries
- [history](#history) - View history

---

## request

Send ad-hoc HTTP requests to any URL.

### Synopsis

```bash
api-ex request --url <url> [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--url <url>` | | Target URL (required) | - |
| `--method <method>` | `-X` | HTTP method | GET |
| `--header <header>` | `-H` | Add header (repeatable) | - |
| `--data <data>` | `-d` | Request body | - |
| `--timeout <ms>` | `-t` | Request timeout in milliseconds | 30000 |
| `--env <name>` | | Environment for variable interpolation | - |

### Description

The `request` command sends HTTP requests to a specified URL. It supports all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS).

Headers are specified in `Key: Value` format and can be repeated multiple times. Request bodies are typically JSON but can be any string content.

When `--env` is specified, the request URL, headers, and body are interpolated using the environment's variables before sending.

### Examples

**Simple GET request:**
```bash
api-ex request --url https://jsonplaceholder.typicode.com/posts/1
```

**POST request with JSON body:**
```bash
api-ex request \
  --url https://httpbin.org/post \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{"username": "john", "password": "secret"}'
```

**PUT request with multiple headers:**
```bash
api-ex request \
  --url https://api.example.com/users/123 \
  --method PUT \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer token123" \
  --header "X-Request-ID: abc-123" \
  --data '{"name": "John Updated"}'
```

**DELETE request:**
```bash
api-ex request \
  --url https://api.example.com/posts/456 \
  --method DELETE \
  --header "Authorization: Bearer token123"
```

**With custom timeout:**
```bash
api-ex request \
  --url https://slow-api.com/data \
  --timeout 120000
```

**Using environment interpolation:**
```bash
api-ex request \
  --url "{{BASE_URL}}/api/v1/users" \
  --header "Authorization: Bearer {{API_TOKEN}}" \
  --env production
```

### Exit Codes

- `0` - Request successful
- `1` - Validation error (invalid input)
- `2` - Runtime error (network failure, timeout)

---

## save

Save a request configuration for later reuse.

### Synopsis

```bash
api-ex save <name> --url <url> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `<name>` | Request name (max 50 characters) |

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--url <url>` | | Target URL (required) | - |
| `--method <method>` | `-X` | HTTP method | GET |
| `--header <header>` | `-H` | Add header (repeatable) | - |
| `--data <data>` | `-d` | Request body | - |

### Description

The `save` command stores a request configuration in the local database for later execution with `run`. Requests can contain `{{VARIABLE}}` placeholders that are resolved at runtime using environments.

Request names must be unique. If a request with the same name exists, it will be overwritten (with a warning). Names should not contain special characters like `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, or `|`.

Saved requests are stored in `~/.api-ex/data.json`.

### Examples

**Save simple GET request:**
```bash
api-ex save get-posts --url https://api.example.com/posts
```

**Save POST request with placeholders:**
```bash
api-ex save create-post \
  --url "{{BASE_URL}}/posts" \
  --method POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer {{TOKEN}}" \
  --data '{"title": "New Post", "body": "Content here"}'
```

**Save authentication request:**
```bash
api-ex save login \
  --url "{{BASE_URL}}/auth/login" \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{"username": "{{USERNAME}}", "password": "{{PASSWORD}}"}'
```

**Overwrite existing request:**
```bash
# Warning will be shown
api-ex save get-posts \
  --url "{{BASE_URL}}/posts?limit=50" \
  --method GET
```

### Naming Guidelines

- Use descriptive names: `get-users`, `create-post`, `delete-comment`
- Avoid spaces (warning will be shown if used)
- Use dashes or underscores: `user-profile`, `user_profile`
- Maximum 50 characters

---

## run

Execute a previously saved request.

### Synopsis

```bash
api-ex run <name> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `<name>` | Name of saved request to execute |

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--env <name>` | | Environment for variable interpolation | - |
| `--header <header>` | `-H` | Override/add headers (repeatable) | - |
| `--data <data>` | `-d` | Override request body | - |

### Description

The `run` command executes a saved request by name. You can optionally specify an environment for variable interpolation and override headers or the request body at runtime.

When headers are overridden, they replace or add to the saved headers. When data is overridden, it completely replaces the saved body.

The request and its response are automatically recorded in history.

### Examples

**Run saved request:**
```bash
api-ex run get-users
```

**With environment interpolation:**
```bash
api-ex run get-users --env production
```

**Override authorization header:**
```bash
api-ex run get-users \
  --env production \
  --header "Authorization: Bearer new-token"
```

**Override request body:**
```bash
api-ex run create-user \
  --env development \
  --data '{"name": "Jane Doe", "email": "jane@example.com"}'
```

**Multiple header overrides:**
```bash
api-ex run api-call \
  --header "Authorization: Bearer token" \
  --header "X-Request-ID: custom-id" \
  --header "Cache-Control: no-cache"
```

### Error Handling

If the request name doesn't exist:
```
Error: No saved request found with name 'unknown-request'.
Use "api-ex ls" to see all saved requests.
```

If the environment doesn't exist:
```
Error: Unknown environment 'staging'. Available: dev, production
Use "api-ex env list" to see available environments.
```

---

## ls

List all saved requests.

### Synopsis

```bash
api-ex ls [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--verbose` | `-v` | Show detailed information | false |
| `--filter <text>` | | Filter by request name | - |

### Description

The `ls` command displays all saved requests in a table format. In normal mode, it shows the request name, HTTP method, and URL. In verbose mode, it additionally shows headers and body data.

The filter option performs case-insensitive partial matching on request names.

### Examples

**List all requests:**
```bash
api-ex ls
```

Output:
```
┌──────────────┬────────┬─────────────────────────────────┐
│ Name         │ Method │ URL                             │
├──────────────┼────────┼─────────────────────────────────┤
│ get-users    │ GET    │ {{BASE_URL}}/users              │
│ create-user  │ POST   │ {{BASE_URL}}/users              │
│ get-posts    │ GET    │ {{BASE_URL}}/posts              │
└──────────────┴────────┴─────────────────────────────────┘
```

**Verbose mode:**
```bash
api-ex ls --verbose
```

Output:
```
┌──────────────┬────────┬─────────────────────┬──────────────────────┬───────────┐
│ Name         │ Method │ URL                 │ Headers              │ Body      │
├──────────────┼────────┼─────────────────────┼──────────────────────┼───────────┤
│ get-users    │ GET    │ {{BASE_URL}}/users  │ Authorization: ...   │ -         │
│ create-user  │ POST   │ {{BASE_URL}}/users  │ Content-Type: ...    │ {"name... │
└──────────────┴────────┴─────────────────────┴──────────────────────┴───────────┘
```

**Filter by name:**
```bash
api-ex ls --filter user
```

Shows only requests with "user" in the name.

**Combine filter and verbose:**
```bash
api-ex ls --filter post --verbose
```

---

## env

Manage environment configurations.

### Synopsis

```bash
api-ex env add <name> <KEY=value>...
api-ex env list
api-ex env ls
api-ex env rm <name>
api-ex env remove <name>
```

### Subcommands

#### env add

Add or update an environment with variables.

```bash
api-ex env add <name> <KEY=value> [KEY=value]...
```

**Arguments:**
- `<name>` - Environment name (max 50 characters)
- `<KEY=value>` - Variable definitions (at least one required)

**Examples:**
```bash
# Single variable
api-ex env add dev BASE_URL=http://localhost:3000

# Multiple variables
api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=prod-secret-key \
  API_VERSION=v2

# Update existing environment (replaces all variables)
api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=new-secret-key
```

#### env list / env ls

List all defined environments.

```bash
api-ex env list
api-ex env ls
```

**Example output:**
```
┌─────────────┬─────────────────────────────┐
│ Environment │ Variables                   │
├─────────────┼─────────────────────────────┤
│ dev         │ BASE_URL, API_KEY, DEBUG    │
│ staging     │ BASE_URL, API_KEY           │
│ production  │ BASE_URL, API_KEY, VERSION  │
└─────────────┴─────────────────────────────┘
```

#### env rm / env remove

Remove an environment.

```bash
api-ex env rm <name>
api-ex env remove <name>
```

**Examples:**
```bash
api-ex env rm staging
api-ex env remove old-env
```

### Variable Naming

- Use UPPERCASE_WITH_UNDERSCORES for consistency
- Common variables: `BASE_URL`, `API_KEY`, `TOKEN`, `USER_ID`
- Variables are case-sensitive

---

## gql

Send GraphQL queries and mutations.

### Synopsis

```bash
api-ex gql <url> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `<url>` | GraphQL endpoint URL |

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--query <query>` | `-q` | Inline GraphQL query | - |
| `--file <file>` | `-f` | Load query from file | - |
| `--variables <json>` | `-v` | Query variables as JSON | - |
| `--header <header>` | `-H` | Add header (repeatable) | - |
| `--env <name>` | | Environment for interpolation | - |

### Description

The `gql` command sends GraphQL queries and mutations. You must provide either an inline query (`--query`) or a file path (`--file`). If both are provided, the file takes precedence.

Variables are passed as a JSON string. Headers are automatically set to include `Content-Type: application/json`.

GraphQL errors in the response are displayed separately from the data.

### Examples

**Simple query:**
```bash
api-ex gql https://api.spacex.land/graphql \
  --query "{ company { name ceo founded } }"
```

**Query with variables:**
```bash
api-ex gql https://api.example.com/graphql \
  --query "query GetUser(\$id: ID!) { user(id: \$id) { name email } }" \
  --variables '{"id": "123"}'
```

**Query from file:**
```bash
# queries/users.graphql contains:
# query ListUsers($limit: Int) {
#   users(limit: $limit) {
#     id
#     name
#     email
#   }
# }

api-ex gql https://api.example.com/graphql \
  --file queries/users.graphql \
  --variables '{"limit": 10}'
```

**Mutation:**
```bash
api-ex gql https://api.example.com/graphql \
  --query "mutation CreateUser(\$name: String!, \$email: String!) {
    createUser(name: \$name, email: \$email) {
      id
      name
    }
  }" \
  --variables '{"name": "John", "email": "john@example.com"}'
```

**With authentication:**
```bash
api-ex gql "{{BASE_URL}}/graphql" \
  --query "{ me { id name } }" \
  --header "Authorization: Bearer {{TOKEN}}" \
  --env production
```

### Error Handling

GraphQL errors are shown in the response:
```
GraphQL Errors:
- Cannot query field 'unknownField' on type 'User'
```

---

## history

View request history.

### Synopsis

```bash
api-ex history [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--limit <number>` | `-n` | Number of entries to show | 10 |
| `--method <method>` | | Filter by HTTP method | - |
| `--status <code>` | | Filter by status code | - |

### Description

The `history` command displays a table of recent HTTP requests. Entries are sorted by timestamp (most recent first). The history is automatically maintained and limited to 100 entries.

Each entry shows:
- Timestamp
- HTTP method
- URL (truncated to 50 characters)
- Status code (color-coded: green for success, red for errors)
- Duration in milliseconds

### Examples

**View last 10 requests:**
```bash
api-ex history
```

**View last 25 requests:**
```bash
api-ex history --limit 25
```

**Filter by method:**
```bash
api-ex history --method POST
```

**Filter by status:**
```bash
api-ex history --status 404
```

**Combine filters:**
```bash
api-ex history --method GET --status 200 --limit 20
```

### Output Example

```
┌─────────────────────┬────────┬───────────────────────────┬────────┬────────┐
│ Timestamp           │ Method │ URL                       │ Status │ Duration│
├─────────────────────┼────────┼───────────────────────────┼────────┼────────┤
│ 11/15/2024, 2:30 PM │ GET    │ https://api.example.com...│ 200    │ 145ms  │
│ 11/15/2024, 2:28 PM │ POST   │ https://api.example.com...│ 201    │ 234ms  │
│ 11/15/2024, 2:25 PM │ GET    │ https://api.example.com...│ 404    │ 89ms   │
└─────────────────────┴────────┴───────────────────────────┴────────┴────────┘
```

---

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `--debug` | Enable debug mode |
| `--version` | Show version number |
| `--help` | Show help |

### Debug Mode

Enable with `--debug` flag or `API_EX_DEBUG=1` environment variable:

```bash
api-ex request --url https://api.example.com/users --debug
```

Debug output includes:
- Axios configuration
- Request headers
- Response headers
- Environment interpolation details

---

## Input Validation

API-EX validates all input:

### Request Names
- Required, non-empty
- Maximum 50 characters
- No special characters: `/\:*?"<>|`
- Warning shown for spaces (dashes/underscores recommended)

### URLs
- Required, non-empty
- Must be valid URL format
- Placeholders (`{{VAR}}`) are allowed

### HTTP Methods
- Must be valid: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Case-insensitive input (converted to uppercase)

### Timeout
- Must be positive number
- Maximum 600000ms (10 minutes)

### JSON Data
- Validated when it looks like JSON (starts with `{` or `[`)
- Must be valid JSON syntax

### Environment Names
- Required, non-empty
- Maximum 50 characters
- No special characters: `/\:*?"<>|`
