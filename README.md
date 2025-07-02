# demo-playground-cli-mount-db

This project demonstrates how to boot a WordPress Playground instance in Node.js **without an HTTP server** (no Express), and how to make direct requests to the Playground's PHP runtime using the request handler API. It is designed for advanced use cases where you want to interact with WordPress programmatically, mount custom directories, or run headless tests.

---

## Features

- Boots WordPress Playground in a Node.js environment.
- No HTTP server required—interact directly with the Playground API.
- **Dynamically fetches the latest WordPress release and SQLite Integration plugin.**
- Supports mounting local directories (e.g., for database or plugin development).
- Example of making direct PHP/HTTP requests to the Playground, including REST API endpoints.
- Blueprint-driven setup: install plugins, define constants, run setup steps, and write files.
- Utility functions for file fetching and following HTTP redirects.

---

## Prerequisites

- Node.js v22+ 
- npm

---

## Installation

1. **Clone the repository** (if you haven't already):

   ```sh
   git clone <your-repo-url>
   cd demo-playground-cli-mount-db
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

---

## Usage

### 1. Prepare your blueprint

Edit `blueprint.json` to define your desired WordPress setup, plugins, constants, and configuration.  
You can also customize the `database/` directory to mount your own files into the Playground.

Example `blueprint.json`:

```json
{
  "steps": [
    { "step": "runWpInstallationWizard", "options": {} },
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "jwt-authentication-for-wp-rest-api"
      }
    },
    {
      "step": "defineWpConfigConsts",
      "consts": {
        "JWT_AUTH_SECRET_KEY": "your-top-secret-key",
        "JWT_AUTH_CORS_ENABLE": true
      }
    },
    {
      "step": "writeFile",
      "path": "/wordpress/wp-content/mu-plugins/rewrite.php",
      "data": "<?php add_action( 'after_setup_theme', function() { global $wp_rewrite; $wp_rewrite->set_permalink_structure('/%postname%/'); $wp_rewrite->flush_rules(); } );"
    }
  ]
}
```

### 2. Build and run

To build the TypeScript code and launch the Playground:

```sh
npm start
```

This will:
- Compile the TypeScript files to `dist/`
- Dynamically fetch the latest WordPress release and the SQLite Integration plugin
- Boot the Playground
- Mount the `database/` directory into `/wordpress/wp-content/database/` inside the Playground
- Run all blueprint steps (install plugins, define constants, write files, etc.)
- Make a sample request to `/wp-json/wp/v2/posts` and print the response

---

## Example: Making a Request

After booting, you can make requests like this (see `src/index.ts`):

```ts
const req = {
  method: "GET",
  url: "/wp-json/wp/v2/posts",
  headers: {}
};
const res = await requestHandler.request(req);
console.log("Response:", res.text, res.httpStatusCode, res.headers);
```

Or, to follow redirects automatically:

```ts
import { requestFollowRedirects } from "./utils";
const res = await requestFollowRedirects(requestHandler, req);
```

---

## Customization

- **WordPress Version:** Change the version in `resolveWordPressRelease("6.8")` in `index.ts`.
- **Plugins:** Add plugin install steps in `blueprint.json`.
- **Constants:** Define WP config constants in `blueprint.json`.
- **Mounts:** Edit the mount logic in `index.ts` to mount other directories.
- **Blueprint:** Use blueprint steps to install plugins, define constants, or run setup steps.
- **Multiple Workers:** For advanced use, you can extend the logic to support multiple PHP workers.

---

## References
- [`wordpress-playground/packages/playground/cli/src/run-cli.ts`](https://github.com/WordPress/wordpress-playground/blob/70d54903540a136c160a112393b35018356c86da/packages/playground/cli/src/run-cli.ts#L562-L596) 
- [WordPress Playground repo](https://github.com/WordPress/wordpress-playground)
- [WordPress Playground documentation](https://wordpress.github.io/wordpress-playground/)

---

## License

ISC 