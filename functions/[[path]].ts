import { createPagesFunctionHandler } from "@react-router/cloudflare";
import type { ServerBuild } from "react-router";
import type { PagesFunction } from "@cloudflare/workers-types";
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

import * as build from "../build/server/index.js";

interface Env {
  // Add your environment bindings here
  // For example:
  // DB: D1Database;
  // MY_KV: KVNamespace;
  [key: string]: unknown;
  DB: D1Database; // Assuming DB binding exists from wrangler.toml
  SESSION_KV: KVNamespace; // Assuming SESSION_KV is also bound
}

// onRequest now just uses the default context behavior
export const onRequest: PagesFunction<Env> = (context) => {
  // Let the handler use its default getLoadContext or pass minimal context
  return createPagesFunctionHandler({
    build: build as unknown as ServerBuild,
    // Remove getLoadContext - use default
  })(context) as any; 
};
