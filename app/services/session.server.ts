import { createWorkersKVSessionStorage } from "@react-router/cloudflare"; // Use the Cloudflare adapter
import type { AppLoadContext } from "react-router"; // For context type in getLoadContext
// Import KVNamespace and D1Database types
import type { KVNamespace, D1Database } from "@cloudflare/workers-types";

// Define the Env structure expected within the context
interface EnvWithBindings {
    DB: D1Database; // Included for completeness, though not used directly here
    SESSION_KV: KVNamespace;
    SESSION_SECRET?: string;
    // Other bindings...
}

// Define the context shape more loosely to allow for variations
// We only really care if `cloudflare.env` exists and has our bindings
interface MaybeCloudflareContext { 
    cloudflare?: { 
      env: Partial<EnvWithBindings>; // Use Partial since not all bindings exist everywhere
      // ... other cloudflare properties
    };
    // ... other top-level properties
}

// Define the structure of your session data
interface SessionData {
  userId?: string; // For logged-in users (link to Firebase UID)
  cartId?: number; // For guest and logged-in user carts
  // Add other session data as needed
}

// --- Cookie Configuration --- 
// Secret is now obtained via context, remove direct process.env access here
// const sessionSecret = process.env.SESSION_SECRET;
// if (!sessionSecret) { /* ... */ }

const sessionCookie = {
    name: "__session",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Infer secure from NODE_ENV
    sameSite: "lax" as const, 
    // secrets will be provided dynamically via getSessionStorage
    // secrets: [process.env.SESSION_SECRET!],
};

// --- KV Session Storage Configuration --- 

// Helper to get KV and Secret from context
function getKvAndSecret(context: AppLoadContext): { kv: KVNamespace; secret: string } {
    // Safely access nested properties
    const env = (context as MaybeCloudflareContext)?.cloudflare?.env;
    const kv = env?.SESSION_KV;
    let secret = env?.SESSION_SECRET;
    
    if (!kv) {
        throw new Error("SESSION_KV binding not found in context.cloudflare.env.");
    }
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("SESSION_SECRET must be set as a secret environment variable in production.");
        } else {
            console.warn("SESSION_SECRET not found in context.cloudflare.env. Using default dev secret. SET THIS IN .dev.vars!");
            secret = "DEFAULT_DEV_SECRET_CHANGE_ME_IN_DOT_DEV_VARS";
        }
    }
    return { kv, secret };
}

// Function to create session storage dynamically based on context
// This ensures the correct KV and secret are used for each request
function getSessionStorage(context: AppLoadContext) {
    const { kv, secret } = getKvAndSecret(context);
    return createWorkersKVSessionStorage<SessionData>({
        cookie: { ...sessionCookie, secrets: [secret] }, // Add secret dynamically
        kv: kv 
    });
}

// Export functions that use the dynamic storage creation
export async function getSession(cookie: string | null | undefined, context: AppLoadContext) {
    return getSessionStorage(context).getSession(cookie);
}

export async function commitSession(session: any, context: AppLoadContext) {
    return getSessionStorage(context).commitSession(session);
}

export async function destroySession(session: any, context: AppLoadContext) {
    return getSessionStorage(context).destroySession(session);
} 