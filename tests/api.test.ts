import { describe, it, expect, beforeAll } from 'vitest';
import { getPlaygroundHandler, PHPRequestHandler, PHPRequest } from '../src/lib.js';

describe('WordPress API functionality', () => {
  let handler: PHPRequestHandler;
  let authToken: string;

  beforeAll(async () => {
    handler = await getPlaygroundHandler({
      blueprintPath: './wordpress/blueprint.json'
    });
  });

  describe('Authentication', () => {
    it('should authenticate and get JWT token', async () => {
      const request: PHPRequest = {
        method: 'POST',
        url: '/wp-json/jwt-auth/v1/token',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'admin',
          password: 'password',
        },
      };

      const response = await handler.request(request);
      const data = JSON.parse(response.text);

      expect(response.httpStatusCode).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.user_email).toBe('admin@localhost.com');
      expect(data.user_nicename).toBe('admin');

      authToken = data.token;
    });

    it('should fail with wrong credentials', async () => {
      const request: PHPRequest = {
        method: 'POST',
        url: '/wp-json/jwt-auth/v1/token',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          username: 'admin',
          password: 'wrongpassword',
        },
      };

      const response = await handler.request(request);
      
      expect(response.httpStatusCode).toBe(403);
    });
  });

  describe('User API', () => {
    it('should get current user info with valid token', async () => {
      const request: PHPRequest = {
        method: 'GET',
        url: '/wp-json/wp/v2/users/me',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      };

      const response = await handler.request(request);
      const data = JSON.parse(response.text);

      expect(response.httpStatusCode).toBe(200);
      expect(data.id).toBe(1);
      expect(data.name).toBe('admin');
      expect(data.email).toBe('admin@localhost.com');
      expect(data.role).toBe('administrator');
      expect(data.capabilities).toBeDefined();
      expect(data.last_login).toBeDefined();
      expect(data.joined).toBeDefined();
    });

    it('should fail without authentication token', async () => {
      const request: PHPRequest = {
        method: 'GET',
        url: '/wp-json/wp/v2/users/me',
      };

      const response = await handler.request(request);
      
      expect(response.httpStatusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const request: PHPRequest = {
        method: 'GET',
        url: '/wp-json/wp/v2/users/me',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      };

      const response = await handler.request(request);
      
      expect(response.httpStatusCode).toBe(403);
    });
  });

  describe('REST API Discovery', () => {
    it('should get REST API index', async () => {
      const response = await handler.request({
        method: 'GET',
        url: '/wp-json/',
      });

      const data = JSON.parse(response.text);

      expect(response.httpStatusCode).toBe(200);
      expect(data.name).toBeDefined();
      expect(data.description).toBeDefined();
      expect(data.url).toBe('http://localhost:8080');
      expect(data.namespaces).toContain('wp/v2');
      expect(data.namespaces).toContain('jwt-auth/v1');
    });
  });

  describe('Posts API', () => {
    it('should retrieve posts', async () => {
      const response = await handler.request({
        method: 'GET',
        url: '/wp-json/wp/v2/posts',
      });

      const posts = JSON.parse(response.text);

      expect(response.httpStatusCode).toBe(200);
      expect(Array.isArray(posts)).toBe(true);
    });

    it('should create a post with authentication', async () => {
      const request: PHPRequest = {
        method: 'POST',
        url: '/wp-json/wp/v2/posts',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          title: 'Test Post',
          content: 'This is a test post content',
          status: 'publish',
        },
      };

      const response = await handler.request(request);
      const post = JSON.parse(response.text);

      expect(response.httpStatusCode).toBe(201);
      expect(post.title.rendered).toBe('Test Post');
      expect(post.content.rendered).toContain('This is a test post content');
      expect(post.status).toBe('publish');
    });
  });
});