# Environment Guide

Learn how to effectively use environments in API-EX for managing different configurations across development, staging, and production.

## Table of Contents

- [What are Environments?](#what-are-environments)
- [Creating Environments](#creating-environments)
- [Variable Interpolation](#variable-interpolation)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Advanced Usage](#advanced-usage)

---

## What are Environments?

Environments in API-EX are named collections of key-value pairs that can be used to interpolate variables in your requests. They allow you to:

- Switch between different API endpoints (dev, staging, production)
- Manage authentication tokens per environment
- Store configuration values that change between contexts
- Keep sensitive data separate from request definitions

### Storage

Environments are stored in `~/.api-ex/data.json` alongside saved requests:

```json
{
  "requests": [...],
  "environments": {
    "development": {
      "BASE_URL": "http://localhost:3000",
      "API_KEY": "dev-key-123"
    },
    "production": {
      "BASE_URL": "https://api.example.com",
      "API_KEY": "prod-secret-key"
    }
  }
}
```

---

## Creating Environments

### Basic Creation

```bash
api-ex env add <name> KEY=value [KEY=value]...
```

**Single variable:**
```bash
api-ex env add local BASE_URL=http://localhost:3000
```

**Multiple variables:**
```bash
api-ex env add development \
  BASE_URL=http://localhost:3000 \
  API_KEY=dev-key-123 \
  DEBUG=true \
  LOG_LEVEL=debug
```

### Updating Environments

When you add an environment with an existing name, it completely replaces the previous configuration:

```bash
# Original
api-ex env add staging BASE_URL=https://staging.example.com

# Update (replaces entirely)
api-ex env add staging \
  BASE_URL=https://staging-v2.example.com \
  API_KEY=new-key
```

### Listing Environments

```bash
api-ex env list
# or
api-ex env ls
```

Output:
```
┌─────────────┬─────────────────────────────────────┐
│ Environment │ Variables                           │
├─────────────┼─────────────────────────────────────┤
│ development │ BASE_URL, API_KEY, DEBUG, LOG_LEVEL │
│ staging     │ BASE_URL, API_KEY                   │
│ production  │ BASE_URL, API_KEY, VERSION          │
└─────────────┴─────────────────────────────────────┘
```

### Removing Environments

```bash
api-ex env rm staging
# or
api-ex env remove staging
```

---

## Variable Interpolation

### Syntax

Variables use double curly brace syntax: `{{VARIABLE_NAME}}`

```bash
# In URLs
--url "{{BASE_URL}}/api/v1/users"

# In headers
--header "Authorization: Bearer {{TOKEN}}"

# In request body
--data '{"apiKey": "{{API_KEY}}", "userId": "{{USER_ID}}"}'
```

### How It Works

1. You save a request with placeholders
2. When running with `--env`, API-EX loads the environment
3. All `{{VAR}}` patterns are replaced with actual values
4. The interpolated request is sent

**Example workflow:**

```bash
# Step 1: Create environment
api-ex env add prod \
  BASE_URL=https://api.example.com \
  TOKEN=secret-prod-token

# Step 2: Save request with placeholders
api-ex save get-users \
  --url "{{BASE_URL}}/users" \
  --header "Authorization: Bearer {{TOKEN}}"

# Step 3: Run with environment
api-ex run get-users --env prod

# Actual request sent:
# GET https://api.example.com/users
# Headers: Authorization: Bearer secret-prod-token
```

### Missing Variables

If a variable is not found in the environment, the placeholder remains unchanged and a warning is shown:

```bash
api-ex env add dev BASE_URL=http://localhost:3000

api-ex request \
  --url "{{BASE_URL}}/api?key={{API_KEY}}" \
  --env dev

# Warning: Environment variable 'API_KEY' not found
# Actual URL: http://localhost:3000/api?key={{API_KEY}}
```

### Variable Scope

Variables are interpolated in:
- ✅ Request URLs
- ✅ Header values (not header names)
- ✅ Request body/data
- ❌ Header names
- ❌ HTTP methods

---

## Best Practices

### 1. Naming Conventions

**Environment names:**
- Use lowercase with dashes: `dev`, `staging`, `prod`, `local-docker`
- Be descriptive: `aws-east`, `gcp-prod`, `k8s-staging`

**Variable names:**
- Use UPPERCASE_WITH_UNDERSCORES
- Be consistent across environments
- Use clear, descriptive names

```bash
# Good
BASE_URL=https://api.example.com
API_KEY=secret123
AUTH_TOKEN=bearer-token
MAX_RETRIES=3

# Avoid
url=https://api.example.com  # lowercase
apikey=secret123             # no separator
tk=bearer-token              # too abbreviated
```

### 2. Consistent Structure

Maintain the same variables across all environments:

```bash
# Development
api-ex env add dev \
  BASE_URL=http://localhost:3000 \
  API_KEY=dev-key \
  TIMEOUT=5000 \
  LOG_LEVEL=debug

# Staging
api-ex env add staging \
  BASE_URL=https://staging.example.com \
  API_KEY=staging-key \
  TIMEOUT=10000 \
  LOG_LEVEL=info

# Production
api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=prod-key \
  TIMEOUT=30000 \
  LOG_LEVEL=error
```

### 3. Sensitive Data

**Do:**
- Use environment variables for API keys and tokens
- Rotate keys when needed by updating environments
- Use different credentials per environment

**Don't:**
- Share production credentials in saved requests
- Commit environments to version control
- Use the same API key across all environments

### 4. Version Your API

Include version information in environments:

```bash
api-ex env add prod-v1 \
  BASE_URL=https://api.example.com/v1 \
  API_VERSION=1

api-ex env add prod-v2 \
  BASE_URL=https://api.example.com/v2 \
  API_VERSION=2
```

---

## Common Patterns

### Pattern 1: Multi-Stage Development

```bash
# Local development
api-ex env add local \
  BASE_URL=http://localhost:3000 \
  API_KEY=local-dev-key \
  DEBUG=true

# Docker environment
api-ex env add docker \
  BASE_URL=http://api:3000 \
  API_KEY=docker-key \
  DEBUG=true

# CI/CD testing
api-ex env add ci \
  BASE_URL=http://test-api.internal \
  API_KEY=ci-test-key \
  DEBUG=false

# Staging
api-ex env add staging \
  BASE_URL=https://staging.example.com \
  API_KEY=staging-secret \
  DEBUG=false

# Production
api-ex env add production \
  BASE_URL=https://api.example.com \
  API_KEY=production-secret \
  DEBUG=false
```

### Pattern 2: User-Specific Configuration

```bash
# Admin user
api-ex env add admin \
  BASE_URL=https://api.example.com \
  USER_TOKEN=admin-token \
  USER_ROLE=admin

# Regular user
api-ex env add user \
  BASE_URL=https://api.example.com \
  USER_TOKEN=user-token \
  USER_ROLE=user

# Guest access
api-ex env add guest \
  BASE_URL=https://api.example.com \
  USER_TOKEN=guest-token \
  USER_ROLE=guest
```

### Pattern 3: Regional Deployments

```bash
# US East
api-ex env add us-east \
  BASE_URL=https://us-east.api.example.com \
  REGION=us-east-1 \
  CDN_URL=https://cdn-east.example.com

# Europe
api-ex env add eu-west \
  BASE_URL=https://eu-west.api.example.com \
  REGION=eu-west-1 \
  CDN_URL=https://cdn-eu.example.com

# Asia Pacific
api-ex env add ap-south \
  BASE_URL=https://ap-south.api.example.com \
  REGION=ap-south-1 \
  CDN_URL=https://cdn-ap.example.com
```

### Pattern 4: Authentication Methods

```bash
# API Key auth
api-ex env add apikey-auth \
  BASE_URL=https://api.example.com \
  AUTH_HEADER=X-API-Key \
  AUTH_VALUE=my-api-key

# Bearer token auth
api-ex env add bearer-auth \
  BASE_URL=https://api.example.com \
  AUTH_HEADER=Authorization \
  AUTH_VALUE=Bearer eyJhbGciOiJIUzI1...

# Basic auth (base64 encoded)
api-ex env add basic-auth \
  BASE_URL=https://api.example.com \
  AUTH_HEADER=Authorization \
  AUTH_VALUE=Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

---

## Advanced Usage

### Dynamic Values in Body

```bash
api-ex env add order-test \
  BASE_URL=https://api.example.com \
  CUSTOMER_ID=cust_123 \
  PRODUCT_ID=prod_456 \
  QUANTITY=5

api-ex save create-order \
  --url "{{BASE_URL}}/orders" \
  --method POST \
  --header "Content-Type: application/json" \
  --data '{
    "customerId": "{{CUSTOMER_ID}}",
    "items": [{
      "productId": "{{PRODUCT_ID}}",
      "quantity": {{QUANTITY}}
    }]
  }'

api-ex run create-order --env order-test
```

### Composing URLs

```bash
api-ex env add api-config \
  PROTOCOL=https \
  HOST=api.example.com \
  PORT=443 \
  VERSION=v2 \
  RESOURCE=users

api-ex save dynamic-url \
  --url "{{PROTOCOL}}://{{HOST}}:{{PORT}}/api/{{VERSION}}/{{RESOURCE}}"
```

### Testing Different Scenarios

```bash
# Success case
api-ex env add test-success \
  BASE_URL=http://localhost:3000 \
  TEST_USER_ID=valid-user-123

# Error case
api-ex env add test-error \
  BASE_URL=http://localhost:3000 \
  TEST_USER_ID=invalid-user

# Edge case
api-ex env add test-edge \
  BASE_URL=http://localhost:3000 \
  TEST_USER_ID=user-with-special-chars%20

api-ex save test-user \
  --url "{{BASE_URL}}/users/{{TEST_USER_ID}}"

# Test each scenario
api-ex run test-user --env test-success
api-ex run test-user --env test-error
api-ex run test-user --env test-edge
```

### GraphQL with Environments

```bash
api-ex env add graphql-prod \
  GQL_URL=https://api.example.com/graphql \
  AUTH_TOKEN=prod-bearer-token \
  PAGE_SIZE=20

api-ex gql "{{GQL_URL}}" \
  --query "query { users(limit: {{PAGE_SIZE}}) { id name } }" \
  --header "Authorization: Bearer {{AUTH_TOKEN}}" \
  --env graphql-prod
```

---

## Environment Management Tips

### Backup Your Environments

```bash
# Backup
cp ~/.api-ex/data.json ~/api-ex-backup.json

# Restore
cp ~/api-ex-backup.json ~/.api-ex/data.json
```

### Share Environments (Template)

Create a template without sensitive values:

```bash
# Create template environment
api-ex env add template \
  BASE_URL=YOUR_BASE_URL_HERE \
  API_KEY=YOUR_API_KEY_HERE \
  USER_ID=YOUR_USER_ID_HERE

# Document in README:
# Replace YOUR_* values with actual credentials
```

### Debug Environment Issues

Use debug mode to see interpolation:

```bash
api-ex run my-request --env production --debug

# Output shows:
# [DEBUG] Environment loaded:
# { BASE_URL: "https://api.example.com", API_KEY: "..." }
# [DEBUG] Request before interpolation:
# { url: "{{BASE_URL}}/users", ... }
# [DEBUG] Request after interpolation:
# { url: "https://api.example.com/users", ... }
```

### Quick Environment Switching

```bash
# Save a request once
api-ex save health-check \
  --url "{{BASE_URL}}/health" \
  --header "Authorization: Bearer {{TOKEN}}"

# Run against different environments
api-ex run health-check --env development
api-ex run health-check --env staging
api-ex run health-check --env production
```

---

## Troubleshooting

### Variable Not Replaced

**Problem:** `{{VAR}}` appears in final request

**Solutions:**
1. Check spelling (case-sensitive): `BASE_URL` vs `base_url`
2. Verify environment exists: `api-ex env list`
3. Confirm variable is in environment
4. Use debug mode: `--debug`

### Environment Not Found

**Problem:** "Unknown environment 'name'"

**Solutions:**
1. List available: `api-ex env list`
2. Check spelling
3. Create the environment

### Special Characters in Values

**Problem:** Values with special characters break

**Solutions:**
```bash
# Values with = signs work fine
api-ex env add test KEY=value=with=equals

# Use shell quoting for complex values
api-ex env add test 'COMPLEX=value with spaces'
```

### Empty Environment

**Problem:** Environment has no variables

**Solution:** Must provide at least one KEY=value pair:
```bash
# Error: No valid variables
api-ex env add empty

# Correct
api-ex env add valid KEY=value
```
