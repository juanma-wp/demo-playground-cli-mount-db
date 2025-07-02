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

export const requestFollowRedirects = async (handler: PHPRequestHandler, request: PHPRequest) => {
    let response = await handler.request(request);
    while (
        [301, 302].includes(response.httpStatusCode) &&
        response.headers["location"].length === 1
    ) {
        response = await requestFollowRedirects(
            handler,
            {
                url: response.headers["location"][0],
            }
        );
    }
    return response;
}

(async () => {
  // Load blueprint.json
  const blueprint = JSON.parse(
    readFileSync(resolve("./blueprint.json"), "utf8")
  );

  // Boot Playground
  // const playground = await bootPlaygroundNode({
  //   blueprint,
  //   mount: [
  //     {
  //       hostPath: resolve('./database/'),
  //       vfsPath: '/wordpress/wp-content/database/',
  //     },
  //   ],
  // });

  const wpDetails = await resolveWordPressRelease("6.8");
  const wordPressZip = await cachedDownload(
    wpDetails.releaseUrl,
    `${wpDetails.version}.zip`
  );
  
  const requestHandler = await bootWordPress({
    siteUrl: "http://localhost:8080",
    createPhpRuntime: async () =>
      await loadNodeRuntime(/*compiledBlueprint.versions.php*/"8.3", {
        // followSymlinks: args.followSymlinks === true,
      }),
    wordPressZip,
    sqliteIntegrationPluginZip: fetchSqliteIntegration(),
    sapiName: "cli",
    createFiles: {
      "/internal/shared/ca-bundle.crt": rootCertificates.join("\n"),
    },
    //constants,
    phpIniEntries: {
      "openssl.cafile": "/internal/shared/ca-bundle.crt",
      allow_url_fopen: "1",
      disable_functions: "",
    },
    // hooks: {
    //   async beforeWordPressFiles(php) {
    //     if (args.mountBeforeInstall) {
    //       mountResources(php, args.mountBeforeInstall);
    //     }
    //   },
    // },
    cookieStore: false,
  });

  // const php = new PHP({
  //   runtime: "node",
  //   runtimeOptions: {
  //     nodeOptions: {
  //       version: "20.10.0",
  //     },
  //   },
  // });
  const php = await requestHandler.getPrimaryPhp();
  php.mkdir("/wordpress/wp-content/database/");   
  php.mount("/wordpress/wp-content/database/", createNodeFsMountHandler("./database/"));

  const compiledBlueprint = await compileBlueprint(blueprint);
  await runBlueprintSteps(compiledBlueprint, php);


  // Make a sample request to /wp-admin/
  const req = {
    //method: "GET",
    url: "/wp-json",
    //headers: {},
//    body: null, 
  };
  const res = await requestHandler.request(req);
  // const res = await requestFollowRedirects(requestHandler, req);
  console.log("Response:", res.httpStatusCode, res.headers, res.text);
})();
