import type { D1Database } from "@cloudflare/workers-types";
// Use relative path for context type import
import type { AppLoadContext } from "../../types/context.js"; 

// Define a type for the expected structure of AppLoadContext
// hostname and storeId are now nested under cloudflare
interface AppLoadContextWithStore {
  cloudflare: {
    env: {
      DB: D1Database;
      // Other env vars...
    };
    hostname: string; // Expect hostname here
    storeId: number | null; // Expect storeId here
    // Other cloudflare context...
  };
  // Other custom context...
}

/**
 * Extracts the D1 database binding from the loader/action context.
 */
export function getDb(context: AppLoadContext): D1Database {
  // Type guard could be used here for extra safety:
  // if (!isAppContext(context)) { 
  //    throw new Error("Invalid application context structure."); 
  // }
  if (!context?.cloudflare?.env?.DB) { 
    throw new Error("D1 Database binding (DB) not found in context.cloudflare.env.");
  }
  return context.cloudflare.env.DB;
}

/**
 * Extracts the D1 database binding and the resolved store ID from the loader/action context.
 * Provides basic error handling if context is missing expected properties.
 *
 * @param context The AppLoadContext provided to loaders/actions.
 * @returns An object containing the D1Database instance and the storeId (or null).
 * @throws If the DB binding or storeId resolution context is missing.
 */
export function getStoreDb(context: AppLoadContext): { db: D1Database } {
  console.warn("`getStoreDb` function is deprecated for storeId lookup. Use `getDb` and resolve storeId in loader/action.");
  return { db: getDb(context) };
}

/**
 * Example of a more advanced wrapper (potential future enhancement)
 * 
 * export class StoreDbClient {
 *   private db: D1Database;
 *   private storeId: number;
 * 
 *   constructor(db: D1Database, storeId: number) {
 *      if (!storeId) throw new Error("StoreDbClient requires a valid storeId.");
 *      this.db = db;
 *      this.storeId = storeId;
 *   }
 * 
 *   prepare(query: string) {
 *      // Basic check to encourage explicit WHERE clause
 *      if (!query.toUpperCase().includes('WHERE')) {
 *          console.warn(`Query in StoreDbClient.prepare lacks WHERE clause: ${query}`);
 *      }
 *      // Here you could potentially modify the query or just return the statement
 *      return this.db.prepare(query);
 *   }
 * 
 *   async findById(tableName: string, id: number | string) {
 *      const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?1 AND store_id = ?2 LIMIT 1`);
 *      return await stmt.bind(id, this.storeId).first();
 *   }
 *   // ... other helper methods
 * }
 * 
 * export function getStoreDbClient(context: AppLoadContextWithStore): StoreDbClient {
 *    const { db, storeId } = getStoreDb(context);
 *    if (storeId === null) {
 *       throw new Error("Cannot create StoreDbClient: No store found for the current context.");
 *    }
 *    return new StoreDbClient(db, storeId);
 * }
 */ 