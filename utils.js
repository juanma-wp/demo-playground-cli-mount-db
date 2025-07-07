import makeFetchCookie from 'fetch-cookie';

const fetchCookie = makeFetchCookie(fetch);

/**
 * Makes an HTTP request to a WordPress Playground server with automatic cookie handling
 * and default headers for WordPress compatibility.
 * 
 * @param {Object} requestOptions - The request configuration object
 * @param {string} requestOptions.method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} requestOptions.url - Relative URL path (will be joined with baseUrl)
 * @param {Object} [requestOptions.headers] - Optional additional headers to include
 * @param {string} [requestOptions.body] - Optional request body (for POST/PUT requests)
 * @param {string} baseUrl - The base URL of the WordPress server
 * 
 * @returns {Promise<Object>} Response object containing:
 *   - {string} text - Response body as text
 *   - {number} httpStatusCode - HTTP status code
 *   - {Object} headers - Response headers as key-value pairs
 * 
 * @throws {Error} Network errors or fetch failures
 * 
 * @example
 * const response = await request({
 *   method: 'GET',
 *   url: '/wp-json/wp/v2/posts',
 *   headers: { 'Authorization': 'Bearer token123' }
 * }, 'http://localhost:8080');
 */
export async function request(requestOptions, baseUrl) {
  const url = new URL(requestOptions.url, baseUrl);
  
  // Set default headers like in the reference login.ts
  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");
  headers.append("Cookie", "playground_auto_login_already_happened=1;");
  
  // Merge with any custom headers passed in
  if (requestOptions.headers) {
    Object.entries(requestOptions.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  const response = await fetchCookie(url.toString(), {
    method: requestOptions.method,
    headers: headers,
    body: requestOptions.body,
  });
  
  const text = await response.text();
  return {
    text,
    httpStatusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

/**
 * Authenticates a user using JWT authentication against the WordPress REST API.
 * 
 * @param {Object} requestHandler - The request handler object with a request method
 * @param {Function} requestHandler.request - Function to make HTTP requests
 * @param {string} username - The WordPress username
 * @param {string} password - The WordPress password
 * 
 * @returns {Promise<string>} JWT token for authenticated requests
 * 
 * @throws {Error} When authentication fails (invalid credentials, server error, etc.)
 * 
 * @example
 * const token = await authenticateUser(requestHandler, 'admin', 'password123');
 * console.log('Authenticated with token:', token);
 */
export async function authenticateUser(requestHandler, username, password) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("username", username);
  urlencoded.append("password", password);

  const response = await requestHandler.request({
    method: "POST",
    url: "/wp-json/jwt-auth/v1/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: urlencoded.toString(),
  });

  if (response.httpStatusCode !== 200) {
    throw new Error(`JWT Login failed: ${response.httpStatusCode}`);
  }

  const data = JSON.parse(response.text);
  console.log("✅ JWT Login successful!");
  console.log("User:", data.user_display_name);
  console.log("Token:", data.token);
  
  return data.token;
}

/**
 * Retrieves the current user's information from the WordPress REST API.
 * 
 * @param {Object} requestHandler - The request handler object with a request method
 * @param {Function} requestHandler.request - Function to make HTTP requests
 * @param {string} token - JWT authentication token
 * 
 * @returns {Promise<Object>} User data object containing user information from WordPress
 * 
 * @throws {Error} When the request fails (invalid token, server error, etc.)
 * 
 * @example
 * const userData = await getUserInfo(requestHandler, 'jwt_token_here');
 * console.log('User ID:', userData.id);
 * console.log('User name:', userData.name);
 */
export async function getUserInfo(requestHandler, token) {
  const response = await requestHandler.request({
    method: "GET",
    url: "/wp-json/wp/v2/users/me",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.httpStatusCode !== 200) {
    throw new Error(`Failed to get user info: ${response.httpStatusCode} - ${response.text}`);
  }

  const userData = JSON.parse(response.text);
  console.log("✅ User info retrieved successfully!");
  console.log("User data:", userData);
  
  return userData;
} 