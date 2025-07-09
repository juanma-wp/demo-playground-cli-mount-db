import { PHPRequest, PHPRequestHandler, PHPResponse } from "@php-wasm/universal";

// Sends a PHP request using the provided handler and follows HTTP 301/302 redirects recursively until a non-redirect response is received.
export const requestFollowRedirects = async (
  handler: PHPRequestHandler,
  request: PHPRequest
): Promise<PHPResponse> => {
  let response = await handler.request(request);
  while (
    [301, 302].includes(response.httpStatusCode) &&
    response.headers["location"] &&
    response.headers["location"].length === 1
  ) {
    response = await requestFollowRedirects(handler, {
      url: response.headers["location"][0],
    });
  }
  return response;
};

// Fetches a file from the given URL and returns it as a File object with the specified file name. Throws an error if the fetch fails.
export async function fetchFileAsFileObject(
  url: string,
  fileName: string
): Promise<File> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const blob = await response.blob();
  return new File([blob], fileName);
}
