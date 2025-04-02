import React from "react";
import {
  type LoaderFunctionArgs,
  useLoaderData,
  // Form // Import if adding remove buttons later
} from "react-router";

import { getSession } from "~/services/session.server.js";
import { getDb } from "~/lib/db/d1-client.server.js";
import { getCartById } from "~/lib/cart/queries.server.js";
import { getStoreIdByHostname } from "~/lib/store/lookup.server.js";
import type { CartWithItems } from "~/lib/cart/queries.server.js";
import type { D1Database } from "@cloudflare/workers-types";

// Define loader data type
interface LoaderData {
  cart: CartWithItems | null;
  error?: string;
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"), context);
  const cartId = session.get("cartId");
  let cart: CartWithItems | null = null;
  let error: string | undefined;

  if (!cartId) {
    console.log("No cartId found in session for /cart route.");
    // No error, just an empty cart scenario potentially
  } else {
    try {
      const db = getDb(context as any);
      const url = new URL(request.url);
      const hostname = url.hostname;
      const storeId = await getStoreIdByHostname(hostname, db);

      if (storeId === null) {
        // Cannot verify cart if we don't know the current store
        error = "Store context not found for cart verification.";
      } else {
        // Pass db and storeId directly to the refactored function
        cart = await getCartById(cartId, db, storeId);
        if (!cart) {
          console.warn(
            `Cart ${cartId} from session not found for store ${storeId}. Session potentially stale.`,
          );
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch cart:", e);
      error = "Failed to load cart data.";
      if (e.message.includes("D1 Database binding (DB) not found")) {
        error = "Database configuration error.";
      }
    }
  }

  const data: LoaderData = { cart, error };
  // Note: We don't commit session here as we didn't modify it (unless we cleared stale cartId)
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: error ? 500 : 200,
  });
}

export default function CartPage() {
  const { cart, error } = useLoaderData() as LoaderData;

  if (error) {
    return (
      <div style={{ color: "red", border: "1px solid red", padding: "1em" }}>
        <p>
          <strong>Error loading cart!</strong>
        </p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Cart</h1>
      {!cart || cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <p>Cart ID: {cart.id}</p>
          <p>Currency: {cart.currency}</p>
          <table
            border={1}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginTop: "1em",
            }}>
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Variant ID</th>
                <th>Quantity</th>
                <th>Price at Add (cents)</th>
                {/* Add remove button column later */}
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.variant_id}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price_at_add}</td>
                  {/* Add remove button cell later */}
                </tr>
              ))}
            </tbody>
          </table>
          {/* TODO: Add checkout button */}
        </div>
      )}
    </div>
  );
}
