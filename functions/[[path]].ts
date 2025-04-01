
import { createPagesFunctionHandler } from "@react-router/cloudflare";
import type { ServerBuild } from "react-router";
import type { PagesFunction, EventContext } from "@cloudflare/workers-types";

import * as build from "../build/server";
interface Env {
  // Add your environment bindings here
  // For example:
  // DB: D1Database;
  // MY_KV: KVNamespace;
  [key: string]: unknown;
  }
  export const onRequest = async (
    context: EventContext<Env, any, Record<string, unknown>>
    ) => {
    const { env, request } = context;
     
    // Create a custom context object to pass to your application
    const customContext = {
    cloudflare: {
    env,
    request: {},functionPath: new URL(request.url).pathname,
params: {},
data: {},
},
// Add any other context properties your app needs
};
 
// Return the Pages function handler
return createPagesFunctionHandler({
build,
getLoadContext: () => customContext,
})(context);
};
