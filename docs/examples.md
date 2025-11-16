# Usage Examples

Real-world examples and common workflows for API-EX.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [REST API Workflows](#rest-api-workflows)
- [Authentication Patterns](#authentication-patterns)
- [Testing Workflows](#testing-workflows)
- [GraphQL Examples](#graphql-examples)
- [CI/CD Integration](#cicd-integration)
- [Real API Examples](#real-api-examples)

---

## Quick Start Examples

### Your First Request

```bash
# Simple GET request to a public API
api-ex request --url https://jsonplaceholder.typicode.com/posts/1
```

Output:
```
✔ GET https://jsonplaceholder.typicode.com/posts/1
Status: 200 OK (234ms)

{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere...",
  "body": "quia et suscipit..."
}
```

### Save and Reuse

```bash
# Save the request
api-ex save get-post --url https://jsonplaceholder.typicode.com/posts/1

# Run it anytime
api-ex run get-post

# List your saved requests
api-ex ls
```

### Create an Environment

```bash
# Set up development environment
api-ex env add dev \
  BASE_URL=https://jsonplaceholder.typicode.com \
  USER_ID=1

# Save request with placeholders
api-ex save user-posts \
  --url "{{BASE_URL}}/users/{{USER_ID}}/posts"

# Run with environment
api-ex run user-posts --env dev
```

---

## REST API Workflows

### Complete CRUD Operations

**Setup environment:**
```bash
api-ex env add api \
  BASE_URL=https://jsonplaceholder.typicode.com
```

**Create (POST):**
```bash
api-ex save create-post \
  --url "{{BASE_URL}}/posts" \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{
    "title": "My New Post",
    "body": "This is the content",
    "userId": 1
  }'

api-ex run create-post --env api
```

**Read (GET):**
```bash
api-ex save get-post \
  --url "{{BASE_URL}}/posts/{{POST_ID}}"

api-ex env add api \
  BASE_URL=https://jsonplaceholder.typicode.com \
  POST_ID=1

api-ex run get-post --env api
```

**Update (PUT):**
```bash
api-ex save update-post \
  --url "{{BASE_URL}}/posts/{{POST_ID}}" \
  --method PUT \
  --header "Content-Type: application/json" \
  --data '{
    "id": {{POST_ID}},
    "title": "Updated Title",
    "body": "Updated content",
    "userId": 1
  }'

api-ex run update-post --env api
```

**Partial Update (PATCH):**
```bash
api-ex save patch-post \
  --url "{{BASE_URL}}/posts/{{POST_ID}}" \
  --method PATCH \
  --header "Content-Type: application/json" \
  --data '{"title": "Just Update Title"}'

api-ex run patch-post --env api
```

**Delete (DELETE):**
```bash
api-ex save delete-post \
  --url "{{BASE_URL}}/posts/{{POST_ID}}" \
  --method DELETE

api-ex run delete-post --env api
```

### Pagination

```bash
# Save paginated request
api-ex save list-posts \
  --url "{{BASE_URL}}/posts?_page={{PAGE}}&_limit={{LIMIT}}"

# Different pagination settings
api-ex env add page1 \
  BASE_URL=https://jsonplaceholder.typicode.com \
  PAGE=1 \
  LIMIT=10

api-ex env add page2 \
  BASE_URL=https://jsonplaceholder.typicode.com \
  PAGE=2 \
  LIMIT=10

# Fetch different pages
api-ex run list-posts --env page1
api-ex run list-posts --env page2
```

### Filtering and Sorting

```bash
# Save filtered request
api-ex save search-posts \
  --url "{{BASE_URL}}/posts?userId={{USER_ID}}&_sort=title&_order=asc"

api-ex env add search \
  BASE_URL=https://jsonplaceholder.typicode.com \
  USER_ID=1

api-ex run search-posts --env search
```

---

## Authentication Patterns

### API Key Authentication

```bash
# In query parameter
api-ex save api-key-query \
  --url "{{BASE_URL}}/data?api_key={{API_KEY}}"

# In header
api-ex save api-key-header \
  --url "{{BASE_URL}}/data" \
  --header "X-API-Key: {{API_KEY}}"

# Create environment
api-ex env add secure \
  BASE_URL=https://api.example.com \
  API_KEY=your-secret-key

api-ex run api-key-header --env secure
```

### Bearer Token

```bash
api-ex save protected-resource \
  --url "{{BASE_URL}}/protected/data" \
  --header "Authorization: Bearer {{TOKEN}}"

api-ex env add auth \
  BASE_URL=https://api.example.com \
  TOKEN=eyJhbGciOiJIUzI1NiIs...

api-ex run protected-resource --env auth
```

### Basic Authentication

```bash
# Base64 encode: username:password -> dXNlcm5hbWU6cGFzc3dvcmQ=
api-ex save basic-auth \
  --url "{{BASE_URL}}/secure" \
  --header "Authorization: Basic {{BASIC_AUTH}}"

api-ex env add basic \
  BASE_URL=https://api.example.com \
  BASIC_AUTH=dXNlcm5hbWU6cGFzc3dvcmQ=

api-ex run basic-auth --env basic
```

### OAuth 2.0 Token Refresh

```bash
# Token refresh request
api-ex save refresh-token \
  --url "{{BASE_URL}}/oauth/token" \
  --method POST \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data "grant_type=refresh_token&refresh_token={{REFRESH_TOKEN}}&client_id={{CLIENT_ID}}&client_secret={{CLIENT_SECRET}}"

api-ex env add oauth \
  BASE_URL=https://auth.example.com \
  REFRESH_TOKEN=your-refresh-token \
  CLIENT_ID=your-client-id \
  CLIENT_SECRET=your-client-secret

api-ex run refresh-token --env oauth
```

### Multiple Auth Environments

```bash
# Admin access
api-ex env add admin-auth \
  BASE_URL=https://api.example.com \
  TOKEN=admin-jwt-token \
  ROLE=admin

# User access
api-ex env add user-auth \
  BASE_URL=https://api.example.com \
  TOKEN=user-jwt-token \
  ROLE=user

# Same request, different permissions
api-ex save get-admin-data \
  --url "{{BASE_URL}}/admin/dashboard" \
  --header "Authorization: Bearer {{TOKEN}}"

api-ex run get-admin-data --env admin-auth  # Works
api-ex run get-admin-data --env user-auth   # 403 Forbidden
```

---

## Testing Workflows

### Health Checks

```bash
api-ex save health-check \
  --url "{{BASE_URL}}/health" \
  --timeout 5000

# Check all environments
api-ex run health-check --env development
api-ex run health-check --env staging
api-ex run health-check --env production
```

### API Endpoint Testing

```bash
# Test various HTTP methods
api-ex request --url https://httpbin.org/get
api-ex request --url https://httpbin.org/post --method POST --data '{"test": true}'
api-ex request --url https://httpbin.org/put --method PUT --data '{"update": true}'
api-ex request --url https://httpbin.org/delete --method DELETE

# Test status codes
api-ex request --url https://httpbin.org/status/200
api-ex request --url https://httpbin.org/status/404
api-ex request --url https://httpbin.org/status/500

# Test delays
api-ex request --url https://httpbin.org/delay/3 --timeout 10000
```

### Request/Response Inspection

```bash
# See what server receives
api-ex request \
  --url https://httpbin.org/anything \
  --method POST \
  --header "Content-Type: application/json" \
  --header "X-Custom-Header: custom-value" \
  --data '{"key": "value"}'

# Response shows exactly what was sent
```

### Error Handling Testing

```bash
# Test different error scenarios
api-ex save test-errors \
  --url "{{BASE_URL}}/status/{{STATUS_CODE}}"

api-ex env add error-400 BASE_URL=https://httpbin.org STATUS_CODE=400
api-ex env add error-401 BASE_URL=https://httpbin.org STATUS_CODE=401
api-ex env add error-404 BASE_URL=https://httpbin.org STATUS_CODE=404
api-ex env add error-500 BASE_URL=https://httpbin.org STATUS_CODE=500

# Test each error
api-ex run test-errors --env error-400
api-ex run test-errors --env error-401
api-ex run test-errors --env error-404
api-ex run test-errors --env error-500
```

### Performance Testing

```bash
# Monitor response times in history
api-ex save perf-test \
  --url "{{BASE_URL}}/api/heavy-operation"

# Run multiple times
for i in {1..10}; do
  api-ex run perf-test --env production
done

# Check history for timings
api-ex history --limit 10
```

---

## GraphQL Examples

### Basic Query

```bash
# Using public SpaceX API
api-ex gql https://spacex-production.up.railway.app/ \
  --query "{ company { name ceo cto founded employees } }"
```

### Query with Variables

```bash
api-ex gql https://api.example.com/graphql \
  --query "
    query GetUser(\$id: ID!) {
      user(id: \$id) {
        id
        name
        email
        createdAt
      }
    }
  " \
  --variables '{"id": "user-123"}'
```

### Mutation

```bash
api-ex gql https://api.example.com/graphql \
  --query "
    mutation CreatePost(\$input: PostInput!) {
      createPost(input: \$input) {
        id
        title
        body
        author {
          name
        }
      }
    }
  " \
  --variables '{
    "input": {
      "title": "My GraphQL Post",
      "body": "Created via API-EX"
    }
  }'
```

### Query from File

Create `queries/users.graphql`:
```graphql
query ListUsers($limit: Int, $offset: Int) {
  users(limit: $limit, offset: $offset) {
    id
    name
    email
    role
  }
  totalUsers
}
```

Run:
```bash
api-ex gql https://api.example.com/graphql \
  --file queries/users.graphql \
  --variables '{"limit": 10, "offset": 0}'
```

### GraphQL with Authentication

```bash
api-ex env add graphql-prod \
  GQL_ENDPOINT=https://api.example.com/graphql \
  AUTH_TOKEN=your-jwt-token

api-ex gql "{{GQL_ENDPOINT}}" \
  --query "{ me { id name email } }" \
  --header "Authorization: Bearer {{AUTH_TOKEN}}" \
  --env graphql-prod
```

### Introspection Query

```bash
api-ex gql https://api.example.com/graphql \
  --query "
    query IntrospectionQuery {
      __schema {
        types {
          name
          kind
          description
        }
      }
    }
  "
```

---

## CI/CD Integration

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

# Set up environments
api-ex env add staging \
  BASE_URL=https://staging.example.com \
  API_KEY=$STAGING_API_KEY

api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=$PRODUCTION_API_KEY

# Save health check
api-ex save health \
  --url "{{BASE_URL}}/health" \
  --header "X-API-Key: {{API_KEY}}" \
  --timeout 10000

# Check staging
echo "Checking staging..."
api-ex run health --env staging
if [ $? -ne 0 ]; then
  echo "Staging health check failed!"
  exit 1
fi

# Check production
echo "Checking production..."
api-ex run health --env production
if [ $? -ne 0 ]; then
  echo "Production health check failed!"
  exit 1
fi

echo "All health checks passed!"
```

### Post-Deployment Verification

```bash
#!/bin/bash
# verify-deployment.sh

VERSION=$1

api-ex env add verify \
  BASE_URL=https://api.example.com \
  EXPECTED_VERSION=$VERSION

# Check version endpoint
api-ex request \
  --url "{{BASE_URL}}/version" \
  --env verify \
  --debug

# Verify critical endpoints
api-ex save verify-auth \
  --url "{{BASE_URL}}/auth/status"

api-ex save verify-api \
  --url "{{BASE_URL}}/api/status"

api-ex run verify-auth --env verify
api-ex run verify-api --env verify
```

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

ENV=$1

# Run critical path tests
api-ex run list-users --env $ENV || exit 1
api-ex run create-user --env $ENV || exit 1
api-ex run get-user --env $ENV || exit 1
api-ex run update-user --env $ENV || exit 1

echo "Smoke tests passed for $ENV"
```

---

## Real API Examples

### GitHub API

```bash
# Setup
api-ex env add github \
  GITHUB_API=https://api.github.com \
  GITHUB_TOKEN=ghp_your_token_here

# Get user info
api-ex save github-user \
  --url "{{GITHUB_API}}/user" \
  --header "Authorization: token {{GITHUB_TOKEN}}" \
  --header "Accept: application/vnd.github.v3+json"

api-ex run github-user --env github

# List repositories
api-ex save github-repos \
  --url "{{GITHUB_API}}/user/repos?sort=updated&per_page=10" \
  --header "Authorization: token {{GITHUB_TOKEN}}" \
  --header "Accept: application/vnd.github.v3+json"

api-ex run github-repos --env github

# Create issue
api-ex save github-create-issue \
  --url "{{GITHUB_API}}/repos/{{OWNER}}/{{REPO}}/issues" \
  --method POST \
  --header "Authorization: token {{GITHUB_TOKEN}}" \
  --header "Accept: application/vnd.github.v3+json" \
  --header "Content-Type: application/json" \
  --data '{
    "title": "{{ISSUE_TITLE}}",
    "body": "{{ISSUE_BODY}}",
    "labels": ["bug"]
  }'

api-ex env add github-issue \
  GITHUB_API=https://api.github.com \
  GITHUB_TOKEN=ghp_your_token \
  OWNER=your-username \
  REPO=your-repo \
  ISSUE_TITLE=Bug Report \
  ISSUE_BODY=Description of the bug

api-ex run github-create-issue --env github-issue
```

### Stripe API

```bash
api-ex env add stripe \
  STRIPE_API=https://api.stripe.com/v1 \
  STRIPE_KEY=sk_test_your_key_here

# List customers
api-ex save stripe-customers \
  --url "{{STRIPE_API}}/customers?limit=10" \
  --header "Authorization: Bearer {{STRIPE_KEY}}"

api-ex run stripe-customers --env stripe

# Create payment intent
api-ex save stripe-payment \
  --url "{{STRIPE_API}}/payment_intents" \
  --method POST \
  --header "Authorization: Bearer {{STRIPE_KEY}}" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data "amount=1000&currency=usd&payment_method_types[]=card"

api-ex run stripe-payment --env stripe
```

### OpenWeather API

```bash
api-ex env add weather \
  WEATHER_API=https://api.openweathermap.org/data/2.5 \
  API_KEY=your_api_key \
  CITY=London \
  UNITS=metric

api-ex save get-weather \
  --url "{{WEATHER_API}}/weather?q={{CITY}}&appid={{API_KEY}}&units={{UNITS}}"

api-ex run get-weather --env weather

# Change city
api-ex env add weather-paris \
  WEATHER_API=https://api.openweathermap.org/data/2.5 \
  API_KEY=your_api_key \
  CITY=Paris \
  UNITS=metric

api-ex run get-weather --env weather-paris
```

### JSONPlaceholder (Testing)

```bash
# Great for testing - no auth required
api-ex env add jsonplaceholder \
  BASE_URL=https://jsonplaceholder.typicode.com

# Full collection
api-ex save jp-posts --url "{{BASE_URL}}/posts"
api-ex save jp-comments --url "{{BASE_URL}}/comments"
api-ex save jp-albums --url "{{BASE_URL}}/albums"
api-ex save jp-photos --url "{{BASE_URL}}/photos"
api-ex save jp-todos --url "{{BASE_URL}}/todos"
api-ex save jp-users --url "{{BASE_URL}}/users"

# Test them all
api-ex run jp-posts --env jsonplaceholder
api-ex run jp-users --env jsonplaceholder
api-ex run jp-todos --env jsonplaceholder
```

---

## Advanced Patterns

### Request Chaining (Manual)

```bash
# Step 1: Login
api-ex save auth-login \
  --url "{{BASE_URL}}/auth/login" \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{"username": "{{USERNAME}}", "password": "{{PASSWORD}}"}'

api-ex run auth-login --env dev
# Copy token from response

# Step 2: Update environment with token
api-ex env add dev-authed \
  BASE_URL=http://localhost:3000 \
  TOKEN=paste-token-here

# Step 3: Make authenticated request
api-ex run protected-resource --env dev-authed
```

### Multi-Header Requests

```bash
api-ex save complex-headers \
  --url "{{BASE_URL}}/api/data" \
  --header "Authorization: Bearer {{TOKEN}}" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json" \
  --header "X-Request-ID: {{REQUEST_ID}}" \
  --header "X-Client-Version: {{CLIENT_VERSION}}" \
  --header "X-Correlation-ID: {{CORRELATION_ID}}" \
  --header "Cache-Control: no-cache"

api-ex env add headers \
  BASE_URL=https://api.example.com \
  TOKEN=jwt-token \
  REQUEST_ID=req-123 \
  CLIENT_VERSION=2.0.0 \
  CORRELATION_ID=corr-456

api-ex run complex-headers --env headers
```

### Debug Workflow

```bash
# Enable debug to troubleshoot
api-ex run problematic-request --env production --debug

# Check what's happening:
# - Environment variables loaded
# - Request before interpolation
# - Request after interpolation
# - Axios configuration
# - Response headers

# Or set globally
export API_EX_DEBUG=1
api-ex run any-request --env any-env
```

### History Analysis

```bash
# View recent activity
api-ex history

# Find failed requests
api-ex history --status 500
api-ex history --status 404

# Analyze POST operations
api-ex history --method POST --limit 20

# Check specific status
api-ex history --status 401  # Auth failures
api-ex history --status 429  # Rate limits
```

---

## Tips and Tricks

### Quick Environment Setup

```bash
# One-liner for complete environment
api-ex env add prod BASE_URL=https://api.prod.com API_KEY=key123 TOKEN=token456 USER=admin
```

### Template Requests

```bash
# Save generic template
api-ex save generic-get \
  --url "{{BASE_URL}}/{{ENDPOINT}}" \
  --header "Authorization: Bearer {{TOKEN}}"

# Reuse for different endpoints
api-ex env add get-users \
  BASE_URL=https://api.example.com \
  ENDPOINT=users \
  TOKEN=your-token

api-ex env add get-posts \
  BASE_URL=https://api.example.com \
  ENDPOINT=posts \
  TOKEN=your-token

api-ex run generic-get --env get-users
api-ex run generic-get --env get-posts
```

### Quick Override

```bash
# Saved request uses environment token
api-ex run protected-api --env production

# Quick override without changing environment
api-ex run protected-api \
  --env production \
  --header "Authorization: Bearer temporary-test-token"
```

### View All Saved Requests

```bash
# Quick view
api-ex ls

# Detailed view
api-ex ls --verbose

# Find specific requests
api-ex ls --filter user
api-ex ls --filter auth
api-ex ls --filter post
```

### Clean Start

```bash
# Remove all data and start fresh
rm -rf ~/.api-ex

# Recreate storage
api-ex env list  # Creates new empty storage
```
