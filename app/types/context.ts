import type {
    D1Database,
    KVNamespace,
    IncomingRequestCfProperties
  } from "@cloudflare/workers-types";
  
  /**
   * Defines the structure of the Cloudflare environment bindings expected in context.cloudflare.env
   * Add all expected bindings from wrangler.toml and Cloudflare Pages settings here.
   */
  export interface AppBindings {
    // D1 Binding
    DB: D1Database;
    // KV Binding for Sessions
    SESSION_KV: KVNamespace;
    // Secrets (populated from Cloudflare Secrets / .dev.vars)
    SESSION_SECRET?: string;
    STRIPE_SECRET_KEY?: string;
    FIREBASE_SERVICE_ACCOUNT_JSON?: string;
    // Public Variables (populated from Cloudflare Variables / .dev.vars)
    STRIPE_PUBLISHABLE_KEY?: string;
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;
    // Allow other unknown bindings that might be present
    [key: string]: unknown;
  }
  
  /**
   * Defines the expected shape of the AppLoadContext provided to Remix loaders/actions.
   * This primarily focuses on the `cloudflare.env` property containing bindings.
   */
  export interface AppLoadContext {
    cloudflare: {
      env: AppBindings;
      // Optional Cloudflare-specific properties (add if needed)
      // cf?: IncomingRequestCfProperties;
      // ctx?: { waitUntil: (promise: Promise<any>) => void };
    };
    // Add other top-level context properties if needed by the application
    // For instance, if we revert functions/[[path]].ts later:
    // hostname?: string;
    // storeId?: number | null;
  }
  
  /**
   * Type guard to safely check if an unknown context object conforms to the expected AppLoadContext structure,
   * specifically checking for the presence of `cloudflare.env`.
   * 
   * @param context The context object received by a loader or action.
   * @returns True if the context has the expected basic structure, false otherwise.
   */
  export function isAppContext(context: unknown): context is AppLoadContext {
      return (
          typeof context === 'object' &&
          context !== null &&
          'cloudflare' in context &&
          typeof context.cloudflare === 'object' &&
          context.cloudflare !== null &&
          'env' in context.cloudflare &&
          typeof context.cloudflare.env === 'object' &&
          context.cloudflare.env !== null
      );
  } 