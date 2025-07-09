import { getPlaygroundHandler, PHPRequest } from "demo-playground-cli-mount-db";
import { resolve } from "path";

(async () => {
  try {
    // Get the Playground handler - this will initialize it only once
    const requestHandler = await getPlaygroundHandler({
      blueprintPath: resolve("./wordpress/blueprint.json")
    });

  // Example 1: Get JWT token
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
  
  // Example 2: Get user info with the token
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
  const userInfo = JSON.parse(resGetUserInfo.text);
  const { id, name, url, description, link, slug, avatar_urls, meta, _links } = userInfo;
  console.log("User info:", userInfo);
  console.log("Response:", resGetUserInfo.httpStatusCode, resGetUserInfo.headers);
  console.log({ id, name, url, description, link, slug, avatar_urls, meta, _links });
  
  } catch (error) {
    console.error("Error running example:", error);
    process.exit(1);
  }
})();