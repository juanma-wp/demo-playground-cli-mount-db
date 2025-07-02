import { PHPRequest, PHPRequestHandler } from "@php-wasm/universal";

export const requestFollowRedirects = async (
  handler: PHPRequestHandler,
  request: PHPRequest
) => {
  let response = await handler.request(request);
  while (
    [301, 302].includes(response.httpStatusCode) &&
    response.headers["location"].length === 1
  ) {
    response = await requestFollowRedirects(handler, {
      url: response.headers["location"][0],
    });
  }
  return response;
};
