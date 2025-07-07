import { handlerPromise } from "./playgroundHandler.js";
import { authenticateUser, getUserInfo } from "./utils.js";

const requestHandler = await handlerPromise;
console.log("Request handler ready");

// Main execution with simplified error handling
try {
  // Test basic connectivity
  const homeResponse = await requestHandler.request({
    method: "GET",
    url: "/",
    headers: {},
  });
  console.log("Home page status:", homeResponse.httpStatusCode);

  // Authenticate and get user info
  const token = await authenticateUser(requestHandler, "admin", "password");
  const userData = await getUserInfo(requestHandler, token);
  
} catch (error) {
  console.log("❌", error.message);
}
