import { createPlaygroundRequestHandler } from "./playground";
import { PHPRequest } from "@php-wasm/universal";
import { requestFollowRedirects } from "./utils";
import { readFileSync } from "fs";
import { resolve } from "path";

(async () => {
  // Load blueprint.json
  const blueprint = JSON.parse(
    readFileSync(resolve("./blueprint.json"), "utf8")
  );
  const requestHandler = await createPlaygroundRequestHandler(blueprint);

  // Make a sample request to /wp-json/wp/v2/posts
  const req = {
    method: "GET",
    url: "/wp-json/wp/v2/posts",
    headers: {},
  } as PHPRequest;

  const res = await requestHandler.request(req);
  // const res = await requestFollowRedirects(requestHandler, req);
  console.log("Response:", res.text, res.httpStatusCode, res.headers);
})(); 