# demo-playground-cli-mount-db

This project demonstrates how to boot a WordPress Playground instance in Node.js **without an HTTP server** (no Express), and how to make direct requests to the Playground's PHP runtime using the request handler API. It is designed for advanced use cases where you want to interact with WordPress programmatically, mount custom directories, or run headless tests.

---

## Features

- Boots WordPress Playground in a Node.js environment.
- No HTTP server required—interact directly with the Playground API.
- Supports mounting local directories (e.g., for database or plugin development).
- Example of making direct PHP/HTTP requests to the Playground.

---

## Prerequisites

- Node.js v18+ (required for `worker_threads` and ES modules)
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

Edit `blueprint.json` to define your desired WordPress setup, plugins, and configuration.  
You can also customize the `database/` directory to mount your own files into the Playground.

### 2. Build and run

To build the TypeScript code and launch the Playground:

```sh
npm start
```

This will:
- Compile the TypeScript files to `dist/`
- Boot the Playground using your `blueprint.json`
- Mount the `database/` directory into `/wordpress/wp-content/database/` inside the Playground
- Make a sample request to `/wp-admin/` and print the response

---

## How it works

- The main entry point is `index.ts`.
- It loads your `blueprint.json`, boots the Playground using `bootPlaygroundNode`, and mounts the `database/` directory.
- You can modify `index.ts` to make additional requests or customize the boot process.

---

## Example: Making a Request

After booting, you can make requests like this:

```ts
const req = {
  method: 'GET',
  url: '/wp-admin/',
  headers: {},
  body: null,
};
const res = await playground['handleRequest'](req);
console.log('Response:', res.status, res.body);
```

---

## Customization

- **Mounts:** Edit the `mount` array in `index.ts` to mount other directories.
- **Blueprint:** Change `blueprint.json` to install plugins, set constants, or run setup steps.
- **Multiple Workers:** For advanced use, you can extend the logic to support multiple PHP workers.

---

## References

- See `docs/boot-node-playground-without-express-server.md` for a detailed technical explanation and code samples.
- [WordPress Playground documentation](https://github.com/WordPress/wordpress-playground)

---

## License

ISC 