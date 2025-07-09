# WordPress Playground Handler Package

This package provides a simple interface to initialize and use WordPress Playground with a singleton pattern.

## Installation

```bash
npm install demo-playground-cli-mount-db
```

## Usage

### Basic Usage

```typescript
import { getPlaygroundHandler, PHPRequest } from 'demo-playground-cli-mount-db';

// Initialize the Playground handler (singleton - only initializes once)
const handler = await getPlaygroundHandler({
  blueprintPath: './wordpress/blueprint.json'
});

// Make requests to WordPress
const response = await handler.request({
  method: 'GET',
  url: '/wp-json/wp/v2/posts'
} as PHPRequest);

console.log(JSON.parse(response.text));
```

### With Custom Blueprint

```typescript
import { getPlaygroundHandler, Blueprint } from 'demo-playground-cli-mount-db';

const blueprint: Blueprint = {
  steps: [
    {
      step: "installPlugin",
      pluginData: {
        resource: "wordpress.org/plugins",
        slug: "akismet"
      }
    }
  ]
};

const handler = await getPlaygroundHandler({ blueprint });
```

### API Reference

#### `getPlaygroundHandler(options?: PlaygroundOptions)`

Returns a Promise that resolves to a PHPRequestHandler.

Options:
- `blueprintPath?: string` - Path to a blueprint.json file
- `blueprint?: Blueprint` - Blueprint object (takes precedence over blueprintPath)

If no options are provided, defaults to `./wordpress/blueprint.json`.

#### Exported Types

- `PHPRequestHandler` - The main handler for making requests
- `PHPRequest` - Request interface
- `PHPResponse` - Response interface
- `Blueprint` - Blueprint configuration interface

### Example: Authentication with JWT

```typescript
import { getPlaygroundHandler, PHPRequest } from 'demo-playground-cli-mount-db';

const handler = await getPlaygroundHandler();

// Get JWT token
const tokenResponse = await handler.request({
  method: "POST",
  url: "/wp-json/jwt-auth/v1/token",
  headers: {
    "Content-Type": "application/json",
  },
  body: {
    username: "admin",
    password: "password",
  },
} as PHPRequest);

const { token } = JSON.parse(tokenResponse.text);

// Use token for authenticated requests
const userResponse = await handler.request({
  method: "GET",
  url: "/wp-json/wp/v2/users/me",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
} as PHPRequest);

console.log(JSON.parse(userResponse.text));
```

## Features

- Singleton pattern ensures Playground initializes only once
- Preserves the original bootWordPress implementation
- TypeScript support with full type definitions
- Flexible blueprint configuration
- Easy to integrate into other applications