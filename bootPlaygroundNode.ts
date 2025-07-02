import { compileBlueprint, isBlueprintBundle } from "@wp-playground/blueprints";
import { FileLockManagerForNode } from "@php-wasm/node";
import { consumeAPI, exposeAPI, RemoteAPI } from "@php-wasm/universal";
import { Worker } from "worker_threads";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { PrimaryWorkerBootOptions, Mount } from "./worker-thread";

// ---- Helper to spawn a worker thread ----
async function spawnPHPWorkerThread(workerPath: string): Promise<Worker> {
  console.log("[spawnPHPWorkerThread] Spawning worker at:", workerPath);
  const worker = new Worker(workerPath);
  return new Promise((resolve, reject) => {
    worker.on("message", (event) => {
      if (event === "worker-script-initialized") {
        console.log("[spawnPHPWorkerThread] Worker initialized");
        resolve(worker);
      }
    });
    worker.on("error", (e) => {
      console.error("[spawnPHPWorkerThread] Worker error:", e);
      reject(e);
    });
  });
}

// Args type for bootPlaygroundNode
export interface BootPlaygroundNodeArgs {
  blueprint: any; // Ideally, use the Blueprint type if available
  login?: boolean;
  php?: string;
  wp?: string;
  mountBeforeInstall?: Mount[];
  mount?: Mount[];
}

// ---- Main boot function ----
export async function bootPlaygroundNode(args: BootPlaygroundNodeArgs) {
  console.log("[bootPlaygroundNode] Received args:", args);
  // 1. Compile blueprint
  const blueprint = isBlueprintBundle(args.blueprint)
    ? args.blueprint
    : {
        login: args.login,
        ...args.blueprint,
        preferredVersions: {
          php: args.php ?? "8.2",
          wp: args.wp ?? "latest",
          ...(args.blueprint?.preferredVersions || {}),
        },
      };
  console.log("[bootPlaygroundNode] Blueprint to compile:", blueprint);
  const compiledBlueprint = await compileBlueprint(blueprint);
  console.log("[bootPlaygroundNode] Compiled blueprint:", compiledBlueprint);

  // 2. Prepare and spawn worker
  const workerPath = resolve(fileURLToPath(import.meta.url), "../worker-thread");
  console.log("[bootPlaygroundNode] Worker path:", workerPath);
  const worker = await spawnPHPWorkerThread(workerPath);
  console.log("[bootPlaygroundNode] Worker spawned");
  const playground = consumeAPI(worker) as RemoteAPI<any>; // Use the correct API type if available
  console.log("[bootPlaygroundNode] Playground API consumed");

  // 3. Expose file lock manager for file ops
  exposeAPI(new FileLockManagerForNode(), undefined, worker);
  console.log("[bootPlaygroundNode] FileLockManagerForNode API exposed");

  // 4. Boot Playground
  console.log("[bootPlaygroundNode] Waiting for playground connection...");
  await playground.isConnected();
  console.log("[bootPlaygroundNode] Playground connected");
  console.log("[bootPlaygroundNode] Booting playground with options:", {
    phpVersion: compiledBlueprint.versions.php,
    wpVersion: compiledBlueprint.versions.wp,
    absoluteUrl: "http://localhost",
    mountsBeforeWpInstall: args.mountBeforeInstall || [],
    mountsAfterWpInstall: args.mount || [],
    wordPressZip: undefined,
    sqliteIntegrationPluginZip: undefined,
    firstProcessId: 0,
    processIdSpaceLength: Number.MAX_SAFE_INTEGER,
    followSymlinks: false,
    trace: false,
  });
  await playground["boot"]({
    phpVersion: compiledBlueprint.versions.php,
    wpVersion: compiledBlueprint.versions.wp,
    absoluteUrl: "http://localhost", // Not actually used without HTTP
    mountsBeforeWpInstall: args.mountBeforeInstall || [],
    mountsAfterWpInstall: args.mount || [],
    wordPressZip: undefined, // Or provide a ZIP buffer if desired
    sqliteIntegrationPluginZip: undefined,
    firstProcessId: 0,
    processIdSpaceLength: Number.MAX_SAFE_INTEGER,
    followSymlinks: false,
    trace: false,
  });
  console.log("[bootPlaygroundNode] Playground booted");

  // 5. Wait for readiness
  console.log("[bootPlaygroundNode] Waiting for playground readiness...");
  await playground.isReady();
  console.log("[bootPlaygroundNode] Playground is ready");

  console.log("[bootPlaygroundNode] Returning playground API");
  return playground;
}
