import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Define the expected structure for client config
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  // measurementId?: string; // Optional
}

let firebaseApp: FirebaseApp;

/**
 * Initializes and returns the Firebase Client App instance.
 * Ensures initialization happens only once (singleton pattern).
 *
 * Requires a config object, typically passed from the server via root loader.
 *
 * @param config - The Firebase client configuration object.
 * @returns The initialized Firebase Client App.
 * @throws Error if config is missing required fields.
 */
export function initializeFirebaseClientApp(config: FirebaseClientConfig): FirebaseApp {
  if (getApps().length > 0) {
    return getApp(); // Return existing app if already initialized
  }

  // Validate essential fields
  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.storageBucket ||
    !config.messagingSenderId ||
    !config.appId
  ) {
    console.error('Firebase client config missing required fields:', config);
    throw new Error('Missing required fields in Firebase client configuration.');
  }

  try {
    firebaseApp = initializeApp(config);
    console.log('Firebase Client SDK initialized successfully.');

    // Optional: Connect to Firebase Auth Emulator during development
    // Make sure the vite/remix dev command passes an env var like VITE_USE_FIREBASE_EMULATOR
    // or checks import.meta.env.DEV
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        try {
            console.log('Connecting to Firebase Auth Emulator...');
            const auth = getAuth(firebaseApp);
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            console.log('Connected to Firebase Auth Emulator.');
        } catch (error) {
            console.warn('Failed to connect to Firebase Auth Emulator (is it running?):', error);
        }
    }

    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase Client SDK:', error);
    throw new Error('Failed to initialize Firebase Client SDK.');
  }
}

/**
 * Gets the initialized Firebase Client App instance.
 *
 * @returns The initialized Firebase Client App.
 * @throws Error if the SDK has not been initialized.
 */
export function getFirebaseClientApp(): FirebaseApp {
  if (!firebaseApp) {
    // This relies on initializeFirebaseClientApp being called first, likely
    // in the root component or entry.client.tsx using config from the loader.
    throw new Error('Firebase Client SDK has not been initialized. Ensure initializeFirebaseClientApp(config) is called first.');
  }
  return firebaseApp;
}

/**
 * Gets the Firebase Client Auth service instance.
 *
 * @returns The Firebase Client Auth service.
 */
export function getClientAuth() {
  const app = getFirebaseClientApp(); // Ensures app is initialized
  return getAuth(app);
} 