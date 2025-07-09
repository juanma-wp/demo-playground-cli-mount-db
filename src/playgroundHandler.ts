import { PHPRequestHandler } from "@php-wasm/universal";
import { Blueprint } from "@wp-playground/blueprints";
import { createPlaygroundRequestHandler } from "./playground.js";

const HANDLER_PROMISE_SYMBOL = Symbol.for('HANDLER_PROMISE');

interface PlaygroundGlobal {
  [key: symbol]: Promise<PHPRequestHandler> | undefined;
}

export function getSingletonHandlerPromise(blueprint: Blueprint): Promise<PHPRequestHandler> {
  const globalObj = global as unknown as PlaygroundGlobal;
  
  if (!globalObj[HANDLER_PROMISE_SYMBOL]) {
    globalObj[HANDLER_PROMISE_SYMBOL] = createHandler(blueprint);
  }
  return globalObj[HANDLER_PROMISE_SYMBOL]!;
}

async function createHandler(blueprint: Blueprint): Promise<PHPRequestHandler> {
  console.log("Creating singleton Playground handler...");
  const handler = await createPlaygroundRequestHandler(blueprint);
  console.log("Singleton Playground handler created successfully");
  return handler;
}