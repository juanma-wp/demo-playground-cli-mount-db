import { createNodeFsMountHandler, loadNodeRuntime } from "@php-wasm/node";
import {
  bootWordPress,
  resolveWordPressRelease
} from "@wp-playground/wordpress";
import { rootCertificates } from "tls";
// import { type Mount, mountResources } from "./mount";

import { PHPRequest, PHPRequestHandler } from "@php-wasm/universal";
import { compileBlueprint, runBlueprintSteps } from "@wp-playground/blueprints";
import {requestFollowRedirects, fetchFileAsFileObject} from "./utils";
import { Blueprint } from "@wp-playground/blueprints";

// Move all logic into a function and export it
export async function createPlaygroundRequestHandler(blueprint: Blueprint) {
  

  const wpDetails = await resolveWordPressRelease("6.8");
  const wordPressZip = await fetchFileAsFileObject(
    wpDetails.releaseUrl,
    `${wpDetails.version}.zip`
  );
  
  const sqliteIntegrationPluginZip = await fetchFileAsFileObject(
    "https://github.com/WordPress/sqlite-database-integration/archive/refs/heads/develop.zip",
    "sqlite.zip"
  );
  
  const requestHandler = await bootWordPress({
    siteUrl: "http://localhost:8080",
    createPhpRuntime: async () =>
      await loadNodeRuntime("8.3"),
    wordPressZip,
    sqliteIntegrationPluginZip,
    sapiName: "cli",
    createFiles: {
      "/internal/shared/ca-bundle.crt": rootCertificates.join("\n"),
    },
    phpIniEntries: {
      "openssl.cafile": "/internal/shared/ca-bundle.crt",
      allow_url_fopen: "1",
      disable_functions: "",
    },
    cookieStore: false,
  });

  const php = await requestHandler.getPrimaryPhp();
  php.mkdir("/wordpress/wp-content/database/");   
  php.mount("/wordpress/wp-content/database/", createNodeFsMountHandler("./database/"));

  const compiledBlueprint = await compileBlueprint(blueprint);
  await runBlueprintSteps(compiledBlueprint, php);

  return requestHandler;
}

// (async () => {
//   // Make a sample request to /wp-json/
//   const req = {
//     method: "GET",
//     url: "/wp-json/wp/v2/posts",
//     headers: {}
//   } as PHPRequest;
//   const res = await requestHandler.request(req);
//   // const res = await requestFollowRedirects(requestHandler, req);
//   console.log("Response:", res.text, res.httpStatusCode, res.headers);
// })();
