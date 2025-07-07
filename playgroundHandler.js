import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";
import { request } from './utils.js';

// Define a unique symbol for the global property to avoid naming conflicts
const HANDLER_PROMISE_SYMBOL = Symbol.for("wp_playground_handler_promise");

async function initializeWpPlayground() {
  console.log("😅 Getting WP Playground server for the first time...");
  try {
    const blueprint = JSON.parse(
      readFileSync(resolve("./blueprint.json"), "utf8")
    );
    console.log("Loaded blueprint:", JSON.stringify(blueprint, null, 2));

    const cliServer = await runCLI({
      command: "server",
      blueprint,
      mount: [
        {
          hostPath: resolve("./database/"),
          vfsPath: `/wordpress/wp-content/database/`,
        },
        {
          hostPath: resolve("./wordpress/plugins/extended-user-info-rest.php"),
          vfsPath: `/wordpress/wp-content/mu-plugins/extended-user-info-rest.php`,
        },
      ],
    });

    console.log("⚙️ WP Playground server initialized successfully");
    
    // Wait a moment for the server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the server address
    const address = cliServer.server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    console.log("🌐 WordPress is running on:", baseUrl);
    
    return {
      baseUrl,
      server: cliServer.server,
      async request(requestOptions) {
        return request(requestOptions, baseUrl);
      }
    };
  } catch (error) {
    console.error("Error starting WP Playground server:", error);
    throw error;
  }
}

function getSingletonHandlerPromise() {
  if (!globalThis[HANDLER_PROMISE_SYMBOL]) {
    console.log("🚀 Initializing WP Playground handler...");
    globalThis[HANDLER_PROMISE_SYMBOL] = initializeWpPlayground();
  } else {
    console.log("✅ Using existing WP Playground handler promise.");
  }
  return globalThis[HANDLER_PROMISE_SYMBOL];
}

export const handlerPromise = getSingletonHandlerPromise();
