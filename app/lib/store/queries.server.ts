import type { AppLoadContext } from "react-router"; // Use AppLoadContext if possible, or define specific type
import { getStoreDb } from "../db/d1-client.server.js";

// Define the Store type based on the DB schema
export interface Store {
  id: number;
  slug: string;
  name: string;
  domain: string | null;
  default_locale: string;
  default_currency: string;
  created_at: string; // Timestamps often come back as strings
  updated_at: string;
}

// Define the shape for creating a store
export interface CreateStoreData {
    slug: string;
    name: string;
    domain?: string | null;
    default_locale?: string | null;
    default_currency?: string | null;
}

// Define the expected context structure again, maybe import from d1-client?
interface AppLoadContextWithStore {
    cloudflare: {
      env: { DB: D1Database; /*...*/ };
      // ...
    };
    storeId: number | null;
    // ...
  }
  
  import type { D1Database } from "@cloudflare/workers-types";

/**
 * Retrieves a store by its unique slug or domain.
 *
 * @param slugOrDomain The store slug or domain name.
 * @param context The loader/action context containing DB binding.
 * @returns The store object or null if not found.
 */
export async function getStoreBySlugOrDomain(
  slugOrDomain: string,
  context: AppLoadContextWithStore
): Promise<Store | null> {
  // Note: This function doesn't use storeId from context, as it's used for initial lookup.
  if (!context?.cloudflare?.env?.DB) {
    throw new Error("D1 Database binding (DB) not found in context.");
  }
  const db = context.cloudflare.env.DB;

  try {
    const stmt = db.prepare(
      "SELECT * FROM stores WHERE slug = ?1 OR domain = ?1 LIMIT 1"
    );
    const store = await stmt.bind(slugOrDomain).first<Store>();
    return store ?? null;
  } catch (error) {
    console.error(`Error fetching store by slug/domain ${slugOrDomain}:`, error);
    return null;
  }
}

/**
 * Creates a new store.
 *
 * @param data Data for the new store.
 * @param context The loader/action context containing DB binding.
 * @returns The created store object or null on failure.
 */
export async function createStore(
    data: CreateStoreData,
    context: AppLoadContextWithStore
): Promise<Store | null> {
    if (!context?.cloudflare?.env?.DB) {
        throw new Error("D1 Database binding (DB) not found in context.");
    }
    const db = context.cloudflare.env.DB;

    // Basic validation
    if (!data.slug || !data.name) {
        console.error("CreateStore failed: slug and name are required.");
        return null;
    }

    const slug = data.slug;
    const name = data.name;
    const domain = data.domain ?? null;
    const default_locale = data.default_locale ?? 'en-US';
    const default_currency = data.default_currency ?? 'USD';

    try {
        const stmt = db.prepare(
          'INSERT INTO stores (slug, name, domain, default_locale, default_currency) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *'
        );
        const result = await stmt.bind(slug, name, domain, default_locale, default_currency).first<Store>();
        
        if (!result) {
            // In D1, RETURNING * might not work as expected on INSERT without a primary key specified
            // Let's try fetching it immediately after insert if result is null
            console.warn("D1 INSERT RETURNING * might not have returned data, attempting fetch by slug.")
            return await getStoreBySlugOrDomain(slug, context); 
        }

        console.log(`Store created successfully: ${result.name} (ID: ${result.id})`);
        return result;

    } catch (error: any) {
        // Handle potential unique constraint violation (slug/domain)
        if (error.message?.includes('UNIQUE constraint failed')) {
            console.error(`CreateStore failed: Slug '${slug}' or domain '${domain}' already exists.`);
        } else {
            console.error(`Error creating store ${slug}:`, error);
        }
        return null;
    }
} 