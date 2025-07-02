import { createNodeFsMountHandler, loadNodeRuntime } from "@php-wasm/node";
import {
  bootWordPress,
  resolveWordPressRelease
} from "@wp-playground/wordpress";
import { rootCertificates } from "tls";
import {
  fetchSqliteIntegration,
  cachedDownload,
} from "./download";
// import { type Mount, mountResources } from "./mount";
import { readFileSync } from "fs";
import { resolve } from "path";
import { PHPRequest, PHPRequestHandler } from "@php-wasm/universal";
import { compileBlueprint, runBlueprintSteps } from "@wp-playground/blueprints";
import {requestFollowRedirects} from "./utils";

(async () => {
  // Load blueprint.json
  const blueprint = JSON.parse(
    readFileSync(resolve("./blueprint.json"), "utf8")
  );

  const wpDetails = await resolveWordPressRelease("6.8");
  const wordPressZip = await cachedDownload(
    wpDetails.releaseUrl,
    `${wpDetails.version}.zip`
  );
  
  const requestHandler = await bootWordPress({
    siteUrl: "http://localhost:8080",
    createPhpRuntime: async () =>
      await loadNodeRuntime("8.3"),
    wordPressZip,
    sqliteIntegrationPluginZip: fetchSqliteIntegration(),
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


  // Make a sample request to /wp-json/
  const req = {
    method: "GET",
    url: "/wp-json/wp/v2/posts",
    headers: {}
  } as PHPRequest;
  const res = await requestHandler.request(req);
  // const res = await requestFollowRedirects(requestHandler, req);
  console.log("Response:", res.text, res.httpStatusCode, res.headers);
})();
