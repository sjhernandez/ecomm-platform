import admin from 'firebase-admin';
import { type App, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Define the structure of the service account expected from the environment variable
// interface ServiceAccount { <-- Remove local definition
//   type: string;
//   project_id: string;
//   private_key_id: string;
//   private_key: string;
//   client_email: string;
//   client_id: string;
//   auth_uri: string;
//   token_uri: string;
//   auth_provider_x509_cert_url: string;
//   client_x509_cert_url: string;
// }

/**
 * Initializes and returns the Firebase Admin App instance.
 * Ensures initialization happens only once (singleton pattern).
 *
 * Requires the FIREBASE_SERVICE_ACCOUNT_JSON environment variable to be set
 * with the JSON content of the service account key.
 *
 * @param env - The Cloudflare environment object containing secrets/vars.
 * @returns The initialized Firebase Admin App.
 * @throws Error if the service account environment variable is missing or invalid JSON.
 */
function initializeFirebaseAdminApp(env: { FIREBASE_SERVICE_ACCOUNT_JSON?: string }): App {
  if (getApps().length > 0) {
    return getApps()[0]; // Return existing app if already initialized
  }

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable for Firebase Admin SDK initialization.',
    );
  }

  let serviceAccount: ServiceAccount;
  try {
    // Replace escaped newlines in the private key if necessary
    const serviceAccountJsonString = env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/\\n/g, '\n');
    serviceAccount = JSON.parse(serviceAccountJsonString) as ServiceAccount;
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    throw new Error(
      'Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON environment variable.',
    );
  }

  // Validate essential fields (add more checks as needed)
  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields (projectId, privateKey, clientEmail).');
  }

  try {
    const app = initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Optional: Specify databaseURL if using Realtime Database
      // databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
    });
    console.log('Firebase Admin SDK initialized successfully.');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

/**
 * Gets the initialized Firebase Admin App instance.
 * Call this function after ensuring initializeFirebaseAdminApp has run (e.g., in middleware or loader context setup).
 *
 * @returns The initialized Firebase Admin App.
 * @throws Error if the SDK has not been initialized.
 */
export function getFirebaseAdminApp(): App {
  if (getApps().length === 0) {
    // This function relies on initializeFirebaseAdminApp being called first,
    // usually during request context setup using the environment variables.
    // Throwing an error here helps catch initialization order issues.
    throw new Error('Firebase Admin SDK has not been initialized. Ensure initializeFirebaseAdminApp(env) is called first.');
  }
  return getApps()[0];
}

/**
 * Gets the Firebase Admin Auth service instance.
 *
 * @returns The Firebase Admin Auth service.
 */
export function getAdminAuth() {
  const app = getFirebaseAdminApp(); // Ensures app is initialized
  return getAuth(app);
}

/**
 * Helper function to safely initialize Firebase Admin SDK, typically used
 * when setting up the load context for Remix routes.
 *
 * @param env - The Cloudflare environment object.
 * @returns The initialized Firebase Admin App or null if initialization fails.
 */
export function safeInitializeFirebaseAdminApp(env: { FIREBASE_SERVICE_ACCOUNT_JSON?: string }): App | null {
    try {
        return initializeFirebaseAdminApp(env);
    } catch (error) {
        console.error('Failed to safely initialize Firebase Admin:', error);
        return null;
    }
} 