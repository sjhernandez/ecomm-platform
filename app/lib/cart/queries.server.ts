import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { getDb } from "~/lib/db/d1-client.server.js"; 
// Use relative path for context type import
import type { AppLoadContext } from "../../types/context.js"; 

// --- Types --- //

export interface Cart {
    id: number;
    store_id: number;
    customer_id: number | null;
    session_id: string | null;
    currency: string;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: number;
    cart_id: number;
    variant_id: number;
    quantity: number;
    price_at_add: number; // Price in cents
    created_at: string;
    updated_at: string;
}

export interface CartWithItems extends Cart {
    items: CartItem[];
}

export interface CreateCartData {
    store_id: number;
    currency: string;
    customer_id?: number | null;
    session_id?: string | null;
}

// --- Queries --- //

/**
 * Creates a new cart for a given store.
 */
export async function createCart(
    data: CreateCartData,
    context: AppLoadContext // Use imported type
): Promise<Cart | null> {
    const db = getDb(context); // getDb now uses AppLoadContext
    // Get storeId from data, not context
    const storeId = data.store_id;

    // Validate required fields
    if (!storeId || !data.currency) {
        console.error("createCart failed: store_id and currency are required.");
        return null;
    }
    // Remove check against context.storeId as it's no longer passed/relevant here
    // if (storeId !== null && data.store_id !== storeId) { /* ... */ }

    const customer_id = data.customer_id ?? null;
    const session_id = data.session_id ?? null;

    try {
        const stmt = db.prepare(
            'INSERT INTO carts (store_id, customer_id, session_id, currency) VALUES (?1, ?2, ?3, ?4) RETURNING *'
        );
        const result = await stmt.bind(
            storeId, // Use storeId from data
            customer_id, 
            session_id, 
            data.currency
        ).first<Cart>();
        
        // D1 RETURNING * fallback (less likely needed here as PK auto-increments)
        if (!result) {
             console.warn("D1 INSERT RETURNING * for carts might not have returned data.");
             // Need a way to get the ID if not returned. Last insert rowid? Requires different approach.
             // For now, return null if RETURNING fails.
            return null;
        }

        console.log(`Cart created successfully (ID: ${result.id})`);
        return result;

    } catch (error: any) {
        console.error(`Error creating cart for store ${storeId}:`, error);
        return null;
    }
}

/**
 * Retrieves a specific cart and its items by Cart ID.
 * Accepts db and storeId directly.
 */
export async function getCartById(
    cartId: number,
    db: D1Database, // Pass DB directly
    storeId: number // Pass resolved storeId directly (non-null)
): Promise<CartWithItems | null> {
    // Removed getStoreDb call
    // storeId is assumed non-null here, checked by caller
    
    try {
        const cartStmt = db.prepare(
            'SELECT * FROM carts WHERE id = ?1 AND store_id = ?2 LIMIT 1'
        );
        // Use passed storeId
        const cart = await cartStmt.bind(cartId, storeId).first<Cart>(); 

        if (!cart) {
            console.log(`Cart not found (ID: ${cartId}) for store ID: ${storeId}`);
            return null;
        }

        const itemsStmt = db.prepare(
            'SELECT * FROM cart_items WHERE cart_id = ?1 ORDER BY id ASC'
        );
        const itemsResult = await itemsStmt.bind(cartId).all<CartItem>();
        const items = itemsResult.results ?? [];

        console.log(`Cart ${cartId} retrieved with ${items.length} items.`);
        return {
            ...cart,
            items: items,
        };

    } catch (error: any) {
        console.error(`Error fetching cart (ID: ${cartId}) for store ${storeId}:`, error);
        return null;
    }
}

/**
 * Adds an item (product variant) to a cart or updates its quantity.
 * Accepts db and storeId directly.
 */
export async function addItemToCart(
    cartId: number,
    variantId: number,
    quantity: number,
    db: D1Database, // Pass DB directly
    storeId: number // Pass resolved storeId directly (non-null)
): Promise<CartItem | null> {
    // Removed getStoreDb call
    // storeId is assumed non-null here, checked by caller

    if (quantity <= 0) {
        console.error("addItemToCart failed: Quantity must be positive.");
        return null;
    }

    try {
        // --- Verify Cart and Variant belong to the store --- 
        const cartCheckStmt = db.prepare('SELECT id FROM carts WHERE id = ?1 AND store_id = ?2 LIMIT 1');
        // Use passed storeId for check
        const cartExists = await cartCheckStmt.bind(cartId, storeId).first();
        if (!cartExists) {
            console.error(`addItemToCart failed: Cart ${cartId} not found or doesn't belong to store ${storeId}.`);
            return null;
        }

        const variantStmt = db.prepare(
            'SELECT v.id, v.price, p.store_id FROM product_variants v JOIN products p ON v.product_id = p.id WHERE v.id = ?1 LIMIT 1'
        );
        const variant = await variantStmt.bind(variantId).first<{ id: number; price: number; store_id: number }>();

        if (!variant) {
            console.error(`addItemToCart failed: Variant ${variantId} not found.`);
            return null;
        }
        // Use passed storeId for check
        if (variant.store_id !== storeId) {
             console.error(`addItemToCart failed: Variant ${variantId} does not belong to store ${storeId}.`);
             return null;
        }
        const price_at_add = variant.price;

        // --- Check if item already exists in cart --- 
        const existingItemStmt = db.prepare(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ?1 AND variant_id = ?2 LIMIT 1'
        );
        const existingItem = await existingItemStmt.bind(cartId, variantId).first<{ id: number; quantity: number }>();

        let upsertedItem: CartItem | null = null;

        if (existingItem) {
            // --- Update existing item quantity --- 
            const newQuantity = existingItem.quantity + quantity;
            const updateStmt = db.prepare(
                'UPDATE cart_items SET quantity = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 RETURNING *'
            );
            upsertedItem = await updateStmt.bind(newQuantity, existingItem.id).first<CartItem>();
            console.log(`Updated item ${existingItem.id} quantity to ${newQuantity} in cart ${cartId}`);

        } else {
            // --- Insert new item --- 
            const insertStmt = db.prepare(
                'INSERT INTO cart_items (cart_id, variant_id, quantity, price_at_add) VALUES (?1, ?2, ?3, ?4) RETURNING *'
            );
            upsertedItem = await insertStmt.bind(cartId, variantId, quantity, price_at_add).first<CartItem>();
            console.log(`Added variant ${variantId} (qty: ${quantity}) to cart ${cartId}`);
        }
        
        // D1 RETURNING * fallback
        if (!upsertedItem) {
            console.warn("D1 UPSERT RETURNING * for cart_items might not have returned data.");
            // Fetch the item manually if RETURNING failed
            const fetchStmt = db.prepare('SELECT * FROM cart_items WHERE cart_id = ?1 AND variant_id = ?2 LIMIT 1');
            upsertedItem = await fetchStmt.bind(cartId, variantId).first<CartItem>();
        }

        return upsertedItem;

    } catch (error: any) {
        console.error(`Error adding item (variant: ${variantId}) to cart (ID: ${cartId}):`, error);
        return null;
    }
}

/**
 * Removes an item from a cart by its Cart Item ID.
 * Accepts db and storeId directly.
 */
export async function removeItemFromCart(
    cartId: number,
    cartItemId: number,
    db: D1Database, // Pass DB directly
    storeId: number // Pass resolved storeId directly (non-null)
): Promise<boolean> {
    // Removed getStoreDb call
    // storeId is assumed non-null here, checked by caller

    try {
        // Optional: Verify cart belongs to store first (uses storeId)
        const cartCheckStmt = db.prepare('SELECT id FROM carts WHERE id = ?1 AND store_id = ?2 LIMIT 1');
        const cartExists = await cartCheckStmt.bind(cartId, storeId).first();
        if (!cartExists) {
            console.error(`removeItemFromCart failed: Cart ${cartId} not found or doesn't belong to store ${storeId}.`);
            return false;
        }

        const deleteStmt = db.prepare(
            'DELETE FROM cart_items WHERE id = ?1 AND cart_id = ?2'
        );
        const result = await deleteStmt.bind(cartItemId, cartId).run();

        if (result.success && result.meta.changes > 0) {
            console.log(`Removed item ${cartItemId} from cart ${cartId}`);
            return true;
        } else if (result.success && result.meta.changes === 0) {
             console.warn(`No item found with ID ${cartItemId} in cart ${cartId} to remove.`);
             return false; // Indicate item wasn't found/removed
        } else {
            console.error(`Failed to remove item ${cartItemId} from cart ${cartId}. Success: ${result.success}`);
            return false;
        }

    } catch (error: any) {
        console.error(`Error removing item ${cartItemId} from cart ${cartId}:`, error);
        return false;
    }
}

// --- TODO: Implement other Cart functions --- //

// export async function removeItemFromCart(cartId: number, cartItemId: number, context: AppLoadContextWithStore): Promise<boolean> { ... } 