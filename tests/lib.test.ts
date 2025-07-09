import { describe, it, expect, beforeAll, vi } from 'vitest';
import { getPlaygroundHandler } from '../src/lib.js';
import { PHPRequestHandler } from '@php-wasm/universal';

describe('getPlaygroundHandler', () => {
  let handler1: PHPRequestHandler;
  let handler2: PHPRequestHandler;

  beforeAll(async () => {
    // Mock console.log to verify initialization messages
    vi.spyOn(console, 'log');
  });

  it('should return a PHPRequestHandler instance', async () => {
    handler1 = await getPlaygroundHandler({
      blueprintPath: './wordpress/blueprint.json'
    });
    
    expect(handler1).toBeDefined();
    expect(handler1.request).toBeDefined();
    expect(typeof handler1.request).toBe('function');
  });

  it('should return the same instance when called multiple times (singleton)', async () => {
    handler2 = await getPlaygroundHandler({
      blueprintPath: './wordpress/blueprint.json'
    });
    
    expect(handler2).toBe(handler1);
  });

  it('should only initialize Playground once', async () => {
    // Reset the call count
    (console.log as any).mockClear();
    
    // Call multiple times
    await getPlaygroundHandler();
    await getPlaygroundHandler();
    await getPlaygroundHandler();
    
    // Should not see "Creating singleton Playground handler..." multiple times
    const initCalls = (console.log as any).mock.calls.filter(
      (call: any[]) => call[0]?.includes('Creating singleton Playground handler')
    );
    
    expect(initCalls.length).toBe(0); // 0 because it was already initialized
  });

  it('should accept blueprint object instead of path', async () => {
    const customBlueprint = {
      steps: [
        {
          step: "runPHP",
          code: "<?php echo 'test';"
        }
      ]
    };
    
    // This should use the cached handler since we're testing singleton
    const handler = await getPlaygroundHandler({ blueprint: customBlueprint });
    
    expect(handler).toBeDefined();
    expect(handler).toBe(handler1); // Should be the same instance
  });

  it('should make a simple request to WordPress', async () => {
    const response = await handler1.request({
      method: 'GET',
      url: '/'
    });
    
    expect(response.httpStatusCode).toBe(200);
    expect(response.text).toContain('<!DOCTYPE html>');
  });
});