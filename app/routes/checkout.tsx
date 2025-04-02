import React from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getSession } from "~/services/session.server.js";
import { getDb } from "~/lib/db/d1-client.server.js";
import { getCartById } from "~/lib/cart/queries.server.js";
import { getStoreIdByHostname } from "~/lib/store/lookup.server.js";
import type { CartWithItems } from "~/lib/cart/queries.server.js";
import type { D1Database } from "@cloudflare/workers-types";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement } from "@stripe/react-stripe-js";

// Define expected Env structure for context
interface EnvWithStripe extends Env {
  // Assuming Env is defined elsewhere or here
  STRIPE_PUBLISHABLE_KEY?: string;
  // SESSION_SECRET is used server-side only usually
  // STRIPE_SECRET_KEY is server-side only
}
interface Env {
  [key: string]: unknown;
  DB: D1Database;
  SESSION_KV: KVNamespace;
}
import type { KVNamespace } from "@cloudflare/workers-types"; // Import if Env is defined here

// Define loader data type
interface LoaderData {
  publishableKey: string | undefined;
  cart: CartWithItems | null;
  error?: string;
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));
  const cartId = session.get("cartId");
  let cart: CartWithItems | null = null;
  let error: string | undefined;
  let publishableKey: string | undefined;

  const env = (context as any)?.cloudflare?.env as EnvWithStripe | undefined;

  if (!env) {
    error = "Application environment context not found.";
  } else {
    publishableKey = env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error(
        "STRIPE_PUBLISHABLE_KEY not found in environment variables (.dev.vars or Cloudflare Pages settings)",
      );
      error = "Stripe configuration error."; // Don't expose missing key details
    }

    if (!cartId) {
      console.log("No cartId found in session for /checkout route.");
      error = error ?? "Your cart is empty."; // Add error if no Stripe key error exists
    } else {
      try {
        const db = getDb(context as any);
        const url = new URL(request.url);
        const hostname = url.hostname;
        const storeId = await getStoreIdByHostname(hostname, db);

        if (storeId === null) {
          error = error ?? "Store context not found.";
        } else {
          const minimalContext = { cloudflare: { env, storeId, hostname } };
          cart = await getCartById(cartId, minimalContext as any);
          if (!cart || cart.items.length === 0) {
            console.warn(
              `Cart ${cartId} not found or empty. Cannot proceed to checkout.`,
            );
            error = error ?? "Your cart is empty or could not be found.";
            cart = null; // Ensure cart is null if empty/not found
          }
        }
      } catch (e: any) {
        console.error("Failed to fetch cart for checkout:", e);
        error = error ?? "Failed to load cart data.";
      }
    }
  }

  const data: LoaderData = { publishableKey, cart, error };
  // Determine status based on errors or missing data needed for checkout
  let status = 200;
  if (error && (!publishableKey || !cart)) {
    status = 500; // Config error or critical load error
  } else if (!cart || cart.items.length === 0) {
    status = 404; // Treat empty/missing cart as not found for checkout purpose
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: status,
  });
}

export default function CheckoutPage() {
  const { publishableKey, cart, error } = useLoaderData() as LoaderData;

  // Initialize Stripe object with the publishable key
  // Ensure this runs only client-side or if publishableKey is present
  // Using React.useMemo to prevent re-initializing on every render
  const stripePromise = React.useMemo(() => {
    if (typeof window !== "undefined" && publishableKey) {
      // Only run client-side with key
      return loadStripe(publishableKey);
    }
    return null;
  }, [publishableKey]);

  if (error) {
    return (
      <div>
        <h1>Checkout Error</h1>
        <p style={{ color: "red" }}>{error}</p>
        <p>
          <a href="/cart">Return to Cart</a>
        </p>
      </div>
    );
  }

  if (!publishableKey || !stripePromise) {
    return <div>Stripe configuration error or loading... Cannot proceed.</div>;
  }

  if (!cart) {
    // Should also be caught by error handling
    return (
      <div>
        Your cart could not be loaded or is empty.{" "}
        <a href="/">Continue Shopping</a>
      </div>
    );
  }

  // Optional: Define appearance or other options
  const options = {
    appearance: { theme: "stripe" as const },
  };

  // Optional: Styling for the CardElement
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <div>
      <h1>Checkout</h1>
      <p>Cart ID: {cart.id}</p>
      <p>Items:</p>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            Variant ID: {item.variant_id} - Qty: {item.quantity} - Price:{" "}
            {(item.price_at_add / 100).toFixed(2)} {cart.currency}
          </li>
        ))}
      </ul>
      <hr />
      <h2>Payment Details</h2>

      <Elements stripe={stripePromise} options={options}>
        <div
          style={{
            padding: "20px",
            border: "1px solid #eee",
            borderRadius: "4px",
            marginTop: "1em",
          }}>
          <CardElement options={cardElementOptions} />
        </div>

        <button style={{ marginTop: "1em" }} disabled>
          Pay Now (Form handling not implemented)
        </button>
      </Elements>
    </div>
  );
}
