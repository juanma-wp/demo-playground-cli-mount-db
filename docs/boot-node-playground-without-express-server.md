To **boot the Node version of Playground without the Express server** and **make requests using the request handler** in the provided code, you can extract and adapt the relevant logic from the `runCLI` function in `run-cli.ts`. Here’s a step-by-step guide, including concrete code snippets:

---

## 1. Boot Playground Without the Express Server

The `runCLI` function orchestrates the boot process, but it's tightly coupled to starting the server through `startServer`.  
To run Playground **without the HTTP server**, you need to:

- Manually create the PHP worker(s)
- Boot them using the same parameters as in `runCLI`
- Hold onto the Playground API object and use its methods directly

### Key Steps from `runCLI`:

- Compile blueprint/configuration
- Prepare mounts and other options
- Spawn worker(s)
- Boot Playground via the API

Here’s a minimal version of the relevant bootstrapping logic **without any HTTP server**:

```ts
import { compileBlueprint, isBlueprintBundle } from '@wp-playground/blueprints';
import { FileLockManagerForNode } from '@php-wasm/node';
import { consumeAPI, exposeAPI } from '@php-wasm/universal';
import { Worker } from 'worker_threads';
// @ts-ignore
import importedWorkerUrlString from './worker-thread?worker&url';

// ---- Helper to spawn a worker thread ----
async function spawnPHPWorkerThread(workerUrl: URL) {
    const worker = new Worker(workerUrl);
    return new Promise((resolve, reject) => {
        worker.on('message', (event) => {
            if (event === 'worker-script-initialized') resolve(worker);
        });
        worker.on('error', (e) => reject(e));
    });
}

// ---- Main boot function ----
export async function bootPlaygroundNode(args) {
    // 1. Compile blueprint
    const blueprint = isBlueprintBundle(args.blueprint)
        ? args.blueprint
        : {
            login: args.login,
            ...args.blueprint,
            preferredVersions: {
                php: args.php ?? '8.2',
                wp: args.wp ?? 'latest',
                ...(args.blueprint?.preferredVersions || {}),
            },
        };
    const compiledBlueprint = await compileBlueprint(blueprint);

    // 2. Prepare and spawn worker
    const workerUrl = new URL(importedWorkerUrlString, import.meta.url);
    const worker = await spawnPHPWorkerThread(workerUrl);
    const playground = consumeAPI(worker);

    // 3. Expose file lock manager for file ops
    exposeAPI(new FileLockManagerForNode(), undefined, worker);

    // 4. Boot Playground
    await playground.isConnected();
    await playground.boot({
        phpVersion: compiledBlueprint.versions.php,
        wpVersion: compiledBlueprint.versions.wp,
        absoluteUrl: 'http://localhost', // Not actually used without HTTP
        mountsBeforeWpInstall: args.mountBeforeInstall || [],
        mountsAfterWpInstall: args.mount || [],
        wordPressZip: undefined, // Or provide a ZIP buffer if desired
        sqliteIntegrationPluginZip: undefined,
        firstProcessId: 0,
        processIdSpaceLength: Number.MAX_SAFE_INTEGER,
        followSymlinks: false,
        trace: false,
    });

    // 5. Wait for readiness
    await playground.isReady();

    return playground;
}
```

---

## 2. Use the Request Handler Directly

The request handler logic in `runCLI` is essentially:

```ts
async function handleRequest(request: PHPRequest) {
    if (!wordPressReady) {
        return PHPResponse.forHttpCode(502, 'WordPress is not ready yet');
    }
    return await loadBalancer.handleRequest(request);
}
```

But if you're running a **single worker** (no load balancer needed), just call:

```ts
const response = await playground.handleRequest(request);
```

- `request` must be a [`PHPRequest`](https://github.com/WordPress/wordpress-playground/blob/trunk/packages/universal/src/api-types.ts), which mimics an HTTP request structure.

**Example:**

```ts
const { PHPRequest } = require('@php-wasm/universal');

// After booting playground as above:

const request = PHPRequest.forHttpRequest({
    method: 'GET',
    url: '/wp-admin/',
    headers: {},
    body: null,
});

const response = await playground.handleRequest(request);

console.log(response.status, response.body);
// Do something with response.headers, response.body, etc.
```

---

## 3. Summary/Recipe

- **Extract and run** the worker boot logic (see code above)
- **Don't start the Express server** or use `startServer`
- **Use the returned `playground` object's `handleRequest` method** to make requests

---

## 4. Minimal Example

```ts
(async () => {
    const playground = await bootPlaygroundNode({
        blueprint: { /* ...your blueprint... */ },
        // ...other args...
    });

    // Now make a request:
    const req = PHPRequest.forHttpRequest({
        method: 'GET',
        url: '/',
        headers: {},
        body: null,
    });
    const res = await playground.handleRequest(req);
    console.log(res.status, res.body);
})();
```

---

## 5. Notes

- You may need to adapt this for your exact mount/config needs.
- If you want multi-worker support, instantiate more workers and use the `LoadBalancer` class from the code.
- All of this avoids setting up any Express server and interacts directly with the Playground API.