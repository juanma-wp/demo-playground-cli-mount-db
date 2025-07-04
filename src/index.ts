import { createPlaygroundRequestHandler } from "./playground.js";
import { PHPRequest } from "@php-wasm/universal";
// import { requestFollowRedirects } from "./utils.js";
import { readFileSync } from "fs";
import { resolve } from "path";

(async () => {
  // Load blueprint.json
  const blueprint = JSON.parse(
    readFileSync(resolve("./wordpress/blueprint.json"), "utf8")
  );
  const requestHandler = await createPlaygroundRequestHandler(blueprint);

  const reqGetToken = {
    method: "POST",
    url: `/wp-json/jwt-auth/v1/token`,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      username: "admin",
      password: "password",
    },
  };

  const resGetToken = await requestHandler.request(reqGetToken as PHPRequest);
  const { token, user_email, user_nicename, user_display_name } = JSON.parse(
    resGetToken.text
  );
  
  console.log(
    "Response:",
    resGetToken.httpStatusCode,
    resGetToken.headers
  );
  console.log({ token, user_email, user_nicename, user_display_name });
  
  const reqGetUserInfo = {
    method: "GET",
    url: `/wp-json/wp/v2/users/me`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };
  const resGetUserInfo = await requestHandler.request(
    reqGetUserInfo as PHPRequest
  );
  const { id, name, url, description, link, slug, avatar_urls, meta, _links } = JSON.parse(resGetUserInfo.text);
  console.log("Response:", resGetUserInfo.httpStatusCode, resGetUserInfo.headers);
  console.log({ id, name, url, description, link, slug, avatar_urls, meta, _links });
})(); 