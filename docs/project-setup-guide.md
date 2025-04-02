# Comprehensive Project Setup Guide (E-Comm Platform)

This guide provides step-by-step instructions to set up the E-Comm Platform project locally for development and configure it for deployment on Cloudflare Pages.

## 1. Prerequisites

*   **Node.js & npm:** Ensure you have a recent version of Node.js (v18 or later recommended) and npm installed.
*   **Cloudflare Account:** You need a Cloudflare account.
*   **Wrangler CLI:** Install the Cloudflare CLI globally and log in:
    ```bash
    npm install -g wrangler
    wrangler login
    ```
*   **Git:** Git must be installed for cloning the repository.

## 2. Initial Project Setup

1.  **Clone Repository:** Clone the project repository from your source control.
2.  **Navigate to Directory:** `cd` into the project's root directory (`ecomm-platform`).
3.  **Install Dependencies:** Install all necessary packages:
    ```bash
    npm install
    ```

## 3. External Services Setup

You need to set up accounts and obtain credentials for Firebase, Stripe, and Cloudflare D1/KV.

### 3.1. Firebase

1.  **Create Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new Firebase project.
2.  **Enable Authentication:** In the Firebase console, navigate to "Authentication" (under Build) and enable the "Email/Password" sign-in method.
3.  **Create Web App:**
    *   Go to Project Settings > General.
    *   Under "Your apps", click the Web icon (`</>`) to add a web app.
    *   Register the app (give it a nickname). You **do not** need to setup Firebase Hosting.
    *   After registration, Firebase will display the configuration object (`firebaseConfig`). **Copy these values** (apiKey, authDomain, projectId, etc.) - you will need them for local configuration.
4.  **Generate Service Account Key (for Admin SDK):**
    *   Go to Project Settings > Service accounts.
    *   Click "Generate new private key".
    *   A JSON file will be downloaded. **Keep this file secure.** You will need its entire contents for deployment configuration.

### 3.2. Stripe

1.  **Create Stripe Account:** Sign up or log in at [Stripe Dashboard](https://dashboard.stripe.com/).
2.  **Activate Account:** Complete any necessary activation steps.
3.  **Get API Keys:**
    *   Navigate to Developers > API keys.
    *   Copy your **Publishable key** (`pk_test_...` or `pk_live_...`).
    *   Click "Reveal test key" (or live key) and copy your **Secret key** (`sk_test_...` or `sk_live_...`). **Keep the Secret Key secure.**

### 3.3. Cloudflare D1 (Database)

1.  **Create Production DB:** Use the Cloudflare dashboard or Wrangler CLI:
    ```bash
    # Choose a unique name, e.g., ecomm-platform-prod-db
    wrangler d1 create <your-prod-db-name>
    ```
    Note the `database_id` output.
2.  **Create Preview DB:** Create a second, separate database for local/preview environments:
    ```bash
    # Choose a unique name, e.g., ecomm-platform-preview-db
    wrangler d1 create <your-preview-db-name>
    ```
    Note the `database_id` output for this one.

### 3.4. Cloudflare KV (Session Storage)

1.  **Create Production KV Namespace:** Use the Cloudflare dashboard or Wrangler CLI:
    ```bash
    # Choose a unique name, e.g., ECOMM_SESSIONS_PROD
    wrangler kv:namespace create <YOUR_PROD_KV_BINDING_NAME>
    ```
    Note the `id` output.
2.  **Create Preview KV Namespace:** Create a second namespace for local/preview:
    ```bash
    # Choose a unique name, e.g., ECOMM_SESSIONS_PREVIEW
    wrangler kv:namespace create <YOUR_PREVIEW_KV_BINDING_NAME> --preview
    ```
    Note the `preview_id` output.

## 4. Local Configuration

Configure your local environment using `.dev.vars` and `wrangler.toml`.

### 4.1. `.dev.vars` File

Create a file named `.dev.vars` in the project root (this file is usually gitignored). Add the **client-side** keys obtained in the previous steps:

```ini
# .dev.vars (for local development via wrangler dev / npm run dev)

# Firebase Client Configuration (from Step 3.1)
FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

# Stripe Publishable Key (from Step 3.2)
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_STRIPE_PUBLISHABLE_KEY"

# Session Secret (Generate a strong random string)
SESSION_SECRET="REPLACE_WITH_A_STRONG_RANDOM_SECRET_STRING_FOR_DEV"

```
**Important:** Generate a strong, random string for `SESSION_SECRET`.

### 4.2. `wrangler.toml` File

Update the `wrangler.toml` file in the project root with the **IDs** obtained from Cloudflare D1 and KV setup:

```toml
# wrangler.toml
name = "ecomm-platform-ts"
compatibility_date = "..."
pages_build_output_dir = "./build/client"

# D1 Database Binding
[[d1_databases]]
binding = "DB" # Used in code (e.g., context.cloudflare.env.DB)
database_name = "ecomm-platform-db" # Should match the name used in `wrangler d1 execute/migrations` commands
database_id = "YOUR_PRODUCTION_D1_DATABASE_ID" # Paste Production DB ID from Step 3.3
preview_database_id = "YOUR_PREVIEW_D1_DATABASE_ID" # Paste Preview DB ID from Step 3.3

# KV Namespace Binding for Sessions
[[kv_namespaces]]
binding = "SESSION_KV" # Used in app/services/session.server.ts
id = "YOUR_PRODUCTION_KV_NAMESPACE_ID" # Paste Production KV ID from Step 3.4
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID" # Paste Preview KV ID from Step 3.4

# Secrets will be configured via Cloudflare dashboard for production
# [vars] # Vars are readable in client/server, use for non-secrets like Stripe PK
# STRIPE_PUBLISHABLE_KEY="pk_test_..."

# [secrets] # Secrets only accessible server-side

```

## 5. Local Database Setup

1.  **Apply Migrations:** Run the schema migrations against your **local/preview** database:
    ```bash
    # Replace 'ecomm-platform-db' if you used a different database_name in wrangler.toml
    wrangler d1 migrations apply ecomm-platform-db --local
    ```
    *(Confirm `y` if prompted)*.
2.  **Seed Database (Optional but Recommended):** Populate the local database with sample data:
    ```bash
    npm run seed
    ```

## 6. Run Locally

Start the development server:

```bash
npm run dev
```
This command uses `@react-router/dev` which leverages Vite and proxies requests through Wrangler for Cloudflare bindings.

Open your browser to the address provided (usually `http://localhost:5173`). You should see the application running using your local D1/KV databases defined by the `preview_id`s.

## 7. Deployment Configuration (Cloudflare Pages)

Before deploying, you need to configure secrets in your Cloudflare Pages project settings:

1.  Go to your Pages project in the Cloudflare dashboard.
2.  Navigate to Settings > Functions > Environment variables.
3.  Under "Secrets", add the following **production** secrets:
    *   `FIREBASE_SERVICE_ACCOUNT_JSON`: Paste the **entire contents** of the JSON service account file you downloaded in Step 3.1.
    *   `STRIPE_SECRET_KEY`: Paste your **live** Stripe Secret Key (`sk_live_...`) obtained in Step 3.2.
    *   `SESSION_SECRET`: Enter a **strong, unique random string** (different from your `.dev.vars` one) for production session security.
4.  (Optional) Under "Variables", add any non-secret production variables if needed (like `STRIPE_PUBLISHABLE_KEY` if you prefer not having it in client-side code directly, although it's generally safe).

## 8. Deploy

1.  **Build the Project:**
    ```bash
    npm run build
    ```
2.  **Deploy to Cloudflare Pages:**
    ```bash
    npm run deploy
    # OR directly:
    # wrangler pages deploy ./build/client
    ```

Follow the prompts from Wrangler to deploy your site. 