import React from "react";
// Add imports for loader and data handling
import { type LoaderFunctionArgs, useLoaderData, Form } from "react-router";
// Remove Chakra UI imports
// import { Box, /* Heading, */ Alert, AlertIcon } from "@chakra-ui/react";

// Imports for DB access and types
import { getDb } from "~/lib/db/d1-client.server.js";
import { getStoreIdByHostname } from "~/lib/store/lookup.server.js";
import type { Store } from "~/lib/store/queries.server.js";
import type { D1Database } from "@cloudflare/workers-types";
// Use relative path for context type import
import type { AppLoadContext } from "../types/context.js";

// Define loader data type
interface IndexLoaderData {
  store: Store | null;
  error?: string;
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs): Promise<Response> {
  // --- Remove Debugging Logs ---
  // console.log("--- _index.tsx loader context start ---");
  // ...
  // console.log("--- _index.tsx loader context end ---");
  // ---------------------------------------------

  let store: Store | null = null;
  let error: string | undefined;

  try {
    // Use imported AppLoadContext for type assertion/safety
    const db = getDb(context as AppLoadContext);

    // 2. Get hostname from request URL
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 3. Look up store ID using hostname and DB
    const storeId = await getStoreIdByHostname(hostname, db);

    // 4. Proceed with fetching store if storeId found
    if (storeId) {
      const stmt = db.prepare("SELECT * FROM stores WHERE id = ?1 LIMIT 1");
      store = await stmt.bind(storeId).first<Store>();
      if (!store) {
        console.warn(
          `Store ID ${storeId} resolved from context, but not found in DB.`,
        );
        // Set error or handle as not found
        error = "Store configured for this domain not found in database.";
      }
    } else {
      error = "No store is configured for this domain.";
      // Log hostname from the correct context path
      console.log(`No store ID found for hostname: ${hostname}`);
    }
  } catch (e: any) {
    console.error("Failed to fetch store in index loader:", e);
    // Catch potential error from getDb if context is wrong
    if (e.message.includes("D1 Database binding (DB) not found")) {
      error = "Database configuration error.";
    } else {
      error = "An error occurred while loading store information.";
    }
  }

  const data: IndexLoaderData = { store, error };
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: error && !store ? 404 : error ? 500 : 200, // Return 404 if context resolved but DB failed, 500 otherwise
  });
}

export default function IndexPage() {
  const { store, error } = useLoaderData() as IndexLoaderData;

  if (error) {
    return (
      // Basic HTML for error message
      <div style={{ color: "red", border: "1px solid red", padding: "1em" }}>
        <p>
          <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  if (!store) {
    // This case should ideally be handled by the error above, but as a fallback:
    return <div>Store not found.</div>;
  }

  return (
    // Use basic HTML
    <div>
      <h1>Welcome to {store.name}!</h1>
      <p>
        Store Slug: {store.slug}
        <br />
        Default Locale: {store.default_locale}
        <br />
        Default Currency: {store.default_currency}
      </p>
      {/* Placeholder for product list (Task 6.5) */}
      <div
        style={{
          marginTop: "1.5em",
          padding: "1em",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}>
        <h2>Products</h2>
        <p>(Placeholder for product list)</p>

        {/* --- Add to Cart Test Form (Task 7.3) --- */}
        <div
          style={{
            marginTop: "1em",
            paddingTop: "1em",
            borderTop: "1px solid #eee",
          }}>
          <h3>Test Add to Cart</h3>
          <Form method="post" action="/cart/add">
            {/* Hardcode variantId=1 and quantity=1 for testing */}
            {/* In real implementation, these would come from product selection */}
            <input type="hidden" name="variantId" value="1" />
            <input type="hidden" name="quantity" value="1" />
            <button type="submit">Add Variant 1 (Qty 1) to Cart</button>
          </Form>
          {/* TODO: Display message from actionData if needed */}
        </div>
        {/* ----------------------------------------- */}
      </div>
    </div>
  );
}
