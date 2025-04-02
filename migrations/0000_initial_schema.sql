-- D1 Migrations
-- Migration: 0001_initial_schema
-- Description: Initial database schema for core entities.

-- Add SQL table definitions below

-- Stores Table
CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT UNIQUE, -- Optional custom domain
    default_locale TEXT NOT NULL DEFAULT 'en-US',
    default_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Trigger to update updated_at timestamp on stores table update
CREATE TRIGGER update_stores_updated_at
AFTER UPDATE ON stores
FOR EACH ROW
BEGIN
    UPDATE stores SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Store Limits Table
CREATE TABLE store_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    plan_name TEXT NOT NULL DEFAULT 'default',
    max_products INTEGER,
    max_variants INTEGER,
    max_staff_accounts INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Trigger to update updated_at timestamp on store_limits table update
CREATE TRIGGER update_store_limits_updated_at
AFTER UPDATE ON store_limits
FOR EACH ROW
BEGIN
    UPDATE store_limits SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Exchange Rates Table (Placeholder for future multi-currency)
CREATE TABLE exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate REAL NOT NULL, -- Using REAL for floating point numbers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (base_currency, target_currency) -- Ensure unique currency pairs
);

-- Categories Table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE (store_id, slug) -- Slugs unique within a store
);

-- Trigger for categories updated_at
CREATE TRIGGER update_categories_updated_at
AFTER UPDATE ON categories
FOR EACH ROW
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Category Translations Table
CREATE TABLE category_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (category_id, locale) -- Only one translation per locale per category
);

-- Trigger for category_translations updated_at
CREATE TRIGGER update_category_translations_updated_at
AFTER UPDATE ON category_translations
FOR EACH ROW
BEGIN
    UPDATE category_translations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Products Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1, -- Boolean (1 for true, 0 for false)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE (store_id, slug)
);

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Product Translations Table
CREATE TABLE product_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, locale)
);

-- Trigger for product_translations updated_at
CREATE TRIGGER update_product_translations_updated_at
AFTER UPDATE ON product_translations
FOR EACH ROW
BEGIN
    UPDATE product_translations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Product Categories Linking Table (Many-to-Many)
CREATE TABLE product_categories (
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
-- No updated_at trigger needed for linking table usually

-- Product Images Table
CREATE TABLE product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Trigger for product_images updated_at
CREATE TRIGGER update_product_images_updated_at
AFTER UPDATE ON product_images
FOR EACH ROW
BEGIN
    UPDATE product_images SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Product Options Table
CREATE TABLE product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- e.g., 'Size', 'Color'. Consider translation later.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE (store_id, name)
);

-- Trigger for product_options updated_at
CREATE TRIGGER update_product_options_updated_at
AFTER UPDATE ON product_options
FOR EACH ROW
BEGIN
    UPDATE product_options SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Product Variants Table
CREATE TABLE product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sku TEXT UNIQUE, -- Assuming SKU is unique across all products/stores for simplicity, adjust if needed
    price INTEGER NOT NULL, -- Store price in cents to avoid floating point issues
    compare_at_price INTEGER, -- Optional, in cents
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    option1_value TEXT, -- e.g., 'Large'
    option2_value TEXT, -- e.g., 'Red'
    option3_value TEXT, -- Can add more if needed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    -- Consider adding UNIQUE constraint on (product_id, option1_value, option2_value, option3_value) if needed
    UNIQUE (product_id, option1_value, option2_value, option3_value)
);

-- Trigger for product_variants updated_at
CREATE TRIGGER update_product_variants_updated_at
AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
    UPDATE product_variants SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Carts Table
CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    customer_id INTEGER, -- Nullable for guest carts
    session_id TEXT, -- For identifying guest carts, needs unique constraint logic if used actively
    currency TEXT NOT NULL, -- Currency for the prices in this cart
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    -- FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE SET NULL -- Add later when customer_profiles exists
);

-- Trigger for carts updated_at
CREATE TRIGGER update_carts_updated_at
AFTER UPDATE ON carts
FOR EACH ROW
BEGIN
    UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Cart Items Table
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add INTEGER NOT NULL, -- Price in cents when item was added
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    UNIQUE (cart_id, variant_id) -- Ensure only one row per variant per cart
);

-- Trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at
AFTER UPDATE ON cart_items
FOR EACH ROW
BEGIN
    UPDATE cart_items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Orders Table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL, -- Assuming orders require a customer
    cart_id INTEGER UNIQUE, -- Optional: Link to the cart it originated from (could be NULL if cart deleted/modified)
    order_number TEXT NOT NULL, -- Store-specific unique, displayable order number
    total_amount INTEGER NOT NULL, -- Total price in cents
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, processing, shipped, delivered, cancelled, refunded
    shipping_address_id INTEGER, -- Link to address later
    billing_address_id INTEGER, -- Link to address later
    stripe_payment_intent_id TEXT, -- Reference to payment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL
    -- FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) -- Add later
    -- FOREIGN KEY (shipping_address_id) REFERENCES customer_addresses(id) -- Add later
    -- FOREIGN KEY (billing_address_id) REFERENCES customer_addresses(id) -- Add later
);

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Order Items Table (Snapshot of cart items at time of order)
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    variant_id INTEGER, -- FK to product_variants, SET NULL if variant deleted
    product_name TEXT NOT NULL, -- Copied from product_translations
    variant_options TEXT, -- Copied descriptive options, e.g., "Size: L, Color: Red"
    sku TEXT, -- Copied SKU
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL, -- Price in cents at time of order
    total_price INTEGER NOT NULL, -- quantity * unit_price, in cents
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Trigger for order_items updated_at
CREATE TRIGGER update_order_items_updated_at
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    UPDATE order_items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Order History Table (Tracks status changes)
CREATE TABLE order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT, -- Optional details about the status change
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
-- No updated_at trigger needed for history table

-- Customer Profiles Table
CREATE TABLE customer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    firebase_uid TEXT UNIQUE NOT NULL, -- Link to Firebase Auth user ID
    email TEXT NOT NULL, -- Denormalized email, should match Firebase
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE (store_id, email) -- Ensure email is unique within a store
);

-- Trigger for customer_profiles updated_at
CREATE TRIGGER update_customer_profiles_updated_at
AFTER UPDATE ON customer_profiles
FOR EACH ROW
BEGIN
    UPDATE customer_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Customer Addresses Table
CREATE TABLE customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_profile_id INTEGER NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_province TEXT, -- State / Province / Region
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 country code
    is_default_shipping INTEGER NOT NULL DEFAULT 0,
    is_default_billing INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
);

-- Trigger for customer_addresses updated_at
CREATE TRIGGER update_customer_addresses_updated_at
AFTER UPDATE ON customer_addresses
FOR EACH ROW
BEGIN
    UPDATE customer_addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- --- Update existing tables with new FKs ---

-- Update Carts Table (Uncomment and add FK)
-- Previous definition:
/*
CREATE TABLE carts (
    ...
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    -- FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE SET NULL -- Add later when customer_profiles exists
);
*/
-- No ALTER TABLE in D1 migrations directly. Need careful planning or new migration.
-- For now, the FKs remain commented out in the original definitions.
-- We will add them properly if needed in a later migration or adjust the model.

-- Update Orders Table (Uncomment and add FKs)
-- Previous definition:
/*
CREATE TABLE orders (
    ...
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL
    -- FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) -- Add later
    -- FOREIGN KEY (shipping_address_id) REFERENCES customer_addresses(id) -- Add later
    -- FOREIGN KEY (billing_address_id) REFERENCES customer_addresses(id) -- Add later
);
*/
-- As above, modifying existing tables in D1 migrations is complex.
-- The FKs remain commented out. We'll manage relations application-side for now. 