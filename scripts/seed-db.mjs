import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuration ---
// Get the database name from wrangler.toml (or hardcode if simpler for script)
// For simplicity, let's hardcode it based on wrangler.toml
const DATABASE_NAME = "ecomm-platform-db";

console.log(`🌱 Seeding database: ${DATABASE_NAME} (Local Preview)`);

// --- Sample Data ---

// Use INSERT OR IGNORE to prevent errors if script is run multiple times
const sql = `
-- Ensure store with ID 1 exists (or first available ID)
INSERT OR IGNORE INTO stores (id, slug, name, domain, default_locale, default_currency) 
VALUES (1, 'test-store', 'Test Store', 'localhost', 'en-US', 'USD');

-- Ensure categories exist (Remove name column)
INSERT OR IGNORE INTO categories (id, store_id, slug) 
VALUES (1, 1, 'electronics');
INSERT OR IGNORE INTO category_translations (category_id, locale, name, description) 
VALUES (1, 'en-US', 'Electronics', 'Gadgets and Devices');

-- Ensure categories exist (Remove name column)
INSERT OR IGNORE INTO categories (id, store_id, slug) 
VALUES (2, 1, 'clothing');
INSERT OR IGNORE INTO category_translations (category_id, locale, name, description) 
VALUES (2, 'en-US', 'Clothing', 'Apparel and Accessories');

-- Ensure products exist
INSERT OR IGNORE INTO products (id, store_id, slug, is_active) 
VALUES (1, 1, 'test-product-1', 1);
INSERT OR IGNORE INTO product_translations (product_id, locale, name, description) 
VALUES (1, 'en-US', 'Test Product 1', 'An amazing test product.');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (1, 1);

INSERT OR IGNORE INTO products (id, store_id, slug, is_active) 
VALUES (2, 1, 'test-product-2', 1);
INSERT OR IGNORE INTO product_translations (product_id, locale, name, description) 
VALUES (2, 'en-US', 'Test Product 2', 'Another great test product.');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (2, 2);

-- Ensure variants exist
INSERT OR IGNORE INTO product_variants (id, product_id, sku, price, stock_quantity, is_active, option1_value) 
VALUES (1, 1, 'TP1-MAIN', 1999, 100, 1, 'Standard');

INSERT OR IGNORE INTO product_variants (id, product_id, sku, price, stock_quantity, is_active, option1_value) 
VALUES (2, 2, 'TP2-SMALL', 2995, 50, 1, 'Small');
INSERT OR IGNORE INTO product_variants (id, product_id, sku, price, stock_quantity, is_active, option1_value) 
VALUES (3, 2, 'TP2-LARGE', 3495, 30, 1, 'Large');

-- Add product options (assuming store_id 1)
INSERT OR IGNORE INTO product_options (id, store_id, name) VALUES (1, 1, 'Size');
INSERT OR IGNORE INTO product_options (id, store_id, name) VALUES (2, 1, 'Color');
`;

// --- Execute Command ---

// Prepare command for shell execution (escape quotes if necessary, but template literals handle newlines)
// Using npx ensures the locally installed wrangler is used
const command = `npx wrangler d1 execute ${DATABASE_NAME} --local --command="${sql.replace(
  /"/g,
  '"',
)}"`;

// Note: For very large SQL, writing to a temp file and using --file might be better.

try {
  // Determine the root directory of the project
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Assuming the script is run from the project root or package.json script
  const projectRoot = path.resolve(__dirname, "..");

  console.log(`Executing command from: ${projectRoot}`);
  // Run wrangler command from the project root directory
  execSync(command, { stdio: "inherit", cwd: projectRoot });
  console.log("✅ Database seeded successfully!");
} catch (error) {
  console.error("❌ Database seeding failed:");
  console.error(error.message);
  process.exit(1);
}
