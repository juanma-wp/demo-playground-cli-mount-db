import { PHPRequestHandler } from "@php-wasm/universal";
import { Blueprint } from "@wp-playground/blueprints";
import { getSingletonHandlerPromise } from "./playgroundHandler.js";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface PlaygroundOptions {
  blueprintPath?: string;
  blueprint?: Blueprint;
}

let cachedHandler: Promise<PHPRequestHandler> | null = null;

export async function getPlaygroundHandler(options: PlaygroundOptions = {}): Promise<PHPRequestHandler> {
  if (!cachedHandler) {
    let blueprint: Blueprint;
    
    if (options.blueprint) {
      blueprint = options.blueprint;
    } else if (options.blueprintPath) {
      blueprint = JSON.parse(
        readFileSync(resolve(options.blueprintPath), "utf8")
      ) as Blueprint;
    } else {
      blueprint = JSON.parse(
        readFileSync(resolve("./wordpress/blueprint.json"), "utf8")
      ) as Blueprint;
    }
    
    cachedHandler = getSingletonHandlerPromise(blueprint);
  }
  
  return cachedHandler;
}

export { PHPRequestHandler, PHPRequest, PHPResponse } from "@php-wasm/universal";
export { Blueprint } from "@wp-playground/blueprints";