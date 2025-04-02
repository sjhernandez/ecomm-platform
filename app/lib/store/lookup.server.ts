import type { D1Database } from "@cloudflare/workers-types";

/**
 * Placeholder function to look up a store ID based on hostname.
 * In a real implementation, this would query the D1 database.
 *
 * @param hostname The request hostname.
 * @param db The D1 database binding.
 * @returns The store ID number or null if not found.
 */
export async function getStoreIdByHostname(
  hostname: string,
  db: D1Database
): Promise<number | null> {
  console.log(`Looking up store for hostname: ${hostname}`);

  // --- Placeholder Logic --- 
  // Replace this with a D1 query later
  // Example: SELECT id FROM stores WHERE domain = ?1 OR slug = ?1 LIMIT 1
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // For local dev, maybe return a default store ID or the first store found
    console.log("Hostname is localhost, attempting to find first store (placeholder).");
    try {
      const firstStore = await db.prepare("SELECT id FROM stores LIMIT 1").first<{
        id: number;
      }>();
      if (firstStore) {
        console.log(`Found first store ID: ${firstStore.id}`);
        return firstStore.id;
      } else {
        console.warn("No stores found in the database for localhost fallback.");
        return null;
      }
    } catch (error) {
      console.error("Error querying first store for localhost fallback:", error);
      return null;
    }
  } 
  // Add specific domain/slug lookups here if needed for testing
  // else if (hostname === 'store1.example.com') {
  //   return 1;
  // }

  // Default: Query by domain (or slug)
  try {
     const stmt = db.prepare("SELECT id FROM stores WHERE domain = ?1 LIMIT 1");
     const store = await stmt.bind(hostname).first<{ id: number }>();
     
     if(store) {
        console.log(`Found store ID by domain: ${store.id}`);
        return store.id;
     } else {
        console.log(`No store found for domain: ${hostname}`);
        // TODO: Add slug lookup based on path later if needed
        return null; 
     }
  } catch(error) {
     console.error(`Error querying store by hostname ${hostname}:`, error);
     return null;
  }
} 