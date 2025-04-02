import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  initializeFirebaseClientApp,
  type FirebaseClientConfig,
} from "~/lib/firebase/firebase.client"; // Use tsconfig path & import type
import type { RootLoaderData } from "~/root"; // Use tsconfig path

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  // Explicitly require firebaseConfig from loader
  firebaseConfig: RootLoaderData["firebaseConfig"];
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  firebaseConfig,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Guard clause: Ensure config is valid before proceeding
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId ||
      !firebaseConfig.storageBucket ||
      !firebaseConfig.messagingSenderId ||
      !firebaseConfig.appId
    ) {
      const errMsg = "Firebase config from loader is incomplete or missing.";
      console.error(errMsg, firebaseConfig);
      setError(new Error(errMsg));
      setLoading(false);
      return; // Don't proceed with initialization
    }

    // At this point, TypeScript knows firebaseConfig has all required string properties
    // because of the check above.
    const validConfig = firebaseConfig as FirebaseClientConfig; // We can now safely assert the type if needed, but TS should infer it.

    try {
      const app = initializeFirebaseClientApp(validConfig); // Pass the validated config
      const auth = getAuth(app);

      // Listen for authentication state changes
      unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
          setError(null); // Clear previous errors on state change
        },
        (authError) => {
          console.error("Firebase Auth Error:", authError);
          setError(authError);
          setUser(null);
          setLoading(false);
        },
      );
    } catch (initError: unknown) {
      console.error("Failed to initialize Firebase Auth listener:", initError);
      setError(
        initError instanceof Error
          ? initError
          : new Error("Unknown Auth initialization error"),
      );
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseConfig]); // Re-run effect if config changes (shouldn't normally happen)

  const value = { user, loading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
