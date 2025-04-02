import React from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";

import { getDb } from "~/lib/db/d1-client.server.js"; // Use tsconfig path alias
import type { Store } from "~/lib/store/queries.server.js"; // Import Store type
import type { AppLoadContext } from "../types/context.js";

// Define loader data type
interface LoaderData {
  stores: Store[];
  error?: string;
}

export async function loader({
  context,
}: LoaderFunctionArgs): Promise<Response> {
  const db = getDb(context as AppLoadContext);
  let stores: Store[] = [];
  let error: string | undefined;

  try {
    // Fetch basic store info
    const stmt = db.prepare(
      "SELECT id, slug, name, domain FROM stores ORDER BY name ASC",
    );
    const result = await stmt.all<Store>();
    stores = result.results ?? [];
  } catch (e: any) {
    console.error("Failed to fetch stores:", e);
    error =
      "Failed to load store data. Please check database connection and configuration.";
    if (e.message.includes("D1 Database binding (DB) not found")) {
      error = "Database configuration error.";
    }
  }

  const data: LoaderData = { stores, error };
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: error ? 500 : 200,
  });
}

export default function AdminStoresPage() {
  // Assert type for loader data
  const { stores, error } = useLoaderData() as LoaderData;

  if (error) {
    return (
      <div style={{ color: "red", border: "1px solid red", padding: "1em" }}>
        <p>
          <strong>Error loading stores!</strong>
        </p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Store List</h2>
      {stores.length === 0 ? (
        <p>No stores found.</p>
      ) : (
        <ul>
          {stores.map((store) => (
            <li key={store.id}>
              {store.name} ({store.slug}){" "}
              {store.domain ? `[${store.domain}]` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
