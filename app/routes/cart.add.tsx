import type { ActionFunctionArgs } from "react-router";
import { getSession, commitSession } from "~/services/session.server.js";
import { getDb } from "~/lib/db/d1-client.server.js";
import {
  createCart,
  getCartById,
  addItemToCart,
} from "~/lib/cart/queries.server.js";
import { getStoreIdByHostname } from "~/lib/store/lookup.server.js";
// Need Store type potentially for default currency
import type { Store } from "~/lib/store/queries.server.js";
// Use relative path for context type import
import type { AppLoadContext } from "../types/context.js";
import type { D1Database } from "@cloudflare/workers-types";

// This route is action-only, it doesn't render a page
export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const variantId = parseInt(formData.get("variantId") as string, 10);
  const quantity = parseInt(formData.get("quantity") as string, 10);

  if (isNaN(variantId) || isNaN(quantity) || quantity <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid variant ID or quantity." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const session = await getSession(request.headers.get("Cookie"), context);

  let error: string | undefined;
  let cartId = session.get("cartId") as number | undefined;
  let currentCart = null;
  let storeId: number | null = null;
  let db: D1Database | null = null;

  try {
    db = getDb(context as AppLoadContext);
    const url = new URL(request.url);
    const hostname = url.hostname;
    storeId = await getStoreIdByHostname(hostname, db);

    if (storeId === null) {
      error = "Store context not found.";
    } else {
      if (cartId) {
        console.log(`Found cartId ${cartId} in session. Verifying...`);
        currentCart = await getCartById(cartId, db, storeId);
        if (!currentCart) {
          console.log(
            `Cart ${cartId} not found or invalid. Clearing from session.`,
          );
          cartId = undefined;
          session.unset("cartId");
        }
      }

      if (!cartId || !currentCart) {
        console.log("No valid cart in session. Creating new cart...");
        const storeStmt = db.prepare(
          "SELECT default_currency FROM stores WHERE id = ?1",
        );
        const storeInfo = await storeStmt
          .bind(storeId)
          .first<{ default_currency: string }>();
        if (!storeInfo) {
          error = "Store not found for cart creation.";
        } else {
          currentCart = await createCart(
            {
              store_id: storeId,
              currency: storeInfo.default_currency,
            },
            context as AppLoadContext,
          );

          if (!currentCart) {
            error = "Failed to create cart.";
          } else {
            cartId = currentCart.id;
            session.set("cartId", cartId);
            console.log(`New cart created (ID: ${cartId}). Set in session.`);
          }
        }
      }
    }
  } catch (e: any) {
    console.error("Error preparing cart:", e);
    error = "An error occurred while preparing the cart.";
    if (e.message.includes("D1 Database binding (DB) not found")) {
      error = "Database configuration error.";
    }
  }

  // If error occurred during setup, return error response
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: error === "Database configuration error." ? 500 : 400,
      headers: {
        "Content-Type": "application/json",
        // Pass original context to commitSession
        "Set-Cookie": cartId ? await commitSession(session, context) : "",
      },
    });
  }

  // If cartId is somehow still null here, something went wrong
  if (cartId === null || cartId === undefined) {
    return new Response(
      JSON.stringify({ error: "Cart could not be identified or created." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // --- Add item to the determined cart ---
  let addedItem = null;
  try {
    addedItem = await addItemToCart(cartId, variantId, quantity, db!, storeId!);
  } catch (e: any) {
    console.error("Error adding item to cart:", e);
    error = "Failed to add item to cart.";
  }

  if (!addedItem || error) {
    return new Response(
      JSON.stringify({ error: error ?? "Failed to add item to cart." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          // Pass original context to commitSession
          "Set-Cookie": await commitSession(session, context),
        },
      },
    );
  }

  // --- Success ---
  return new Response(JSON.stringify({ success: true, item: addedItem }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Pass original context to commitSession
      "Set-Cookie": await commitSession(session, context),
    },
  });
}

// No default export needed for an action-only route
