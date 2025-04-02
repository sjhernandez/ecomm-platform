import React from "react";
import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { Box, Flex, Text, Button, Spacer } from "@chakra-ui/react";
import { Provider as ChakraUIProvider } from "~/components/ui/provider";

import type { Route } from "./+types/root";
import { AuthProvider, useAuth } from "~/context/AuthContext";
import { getClientAuth } from "~/lib/firebase/firebase.client";
import { signOut } from "firebase/auth";

export interface RootLoaderData {
  firebaseConfig: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export async function loader({
  request,
  context,
}: LoaderFunctionArgs): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/favicon.ico") {
    return new Response(null, { status: 204 });
  }

  const env = (context as any)?.cloudflare?.env as
    | {
        FIREBASE_API_KEY?: string;
        FIREBASE_AUTH_DOMAIN?: string;
        FIREBASE_PROJECT_ID?: string;
        FIREBASE_STORAGE_BUCKET?: string;
        FIREBASE_MESSAGING_SENDER_ID?: string;
        FIREBASE_APP_ID?: string;
      }
    | undefined;

  const firebaseConfig = {
    apiKey: env?.FIREBASE_API_KEY,
    authDomain: env?.FIREBASE_AUTH_DOMAIN,
    projectId: env?.FIREBASE_PROJECT_ID,
    storageBucket: env?.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env?.FIREBASE_MESSAGING_SENDER_ID,
    appId: env?.FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase client configuration missing in environment variables (apiKey or projectId). Firebase features may not work.",
    );
  }

  const data: RootLoaderData = { firebaseConfig };

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

function AppHeader() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <Flex as="header" p={4} borderBottomWidth="1px" alignItems="center">
      <Box fontWeight="bold">
        <Link to="/">E-Comm Platform</Link>
      </Box>
      <Spacer />
      <Box>
        {loading ? (
          <Text>Loading...</Text>
        ) : user ? (
          <Flex alignItems="center" gap={4}>
            <Text>Welcome, {user.email}</Text>
            <Button onClick={handleLogout} size="sm">
              Logout
            </Button>
          </Flex>
        ) : (
          <Flex gap={4}>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData() as RootLoaderData | undefined;
  const firebaseConfig = loaderData?.firebaseConfig ?? {};

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ChakraUIProvider>
          <AuthProvider firebaseConfig={firebaseConfig}>
            <AppHeader />
            <Box as="main" p={4}>
              {children}
            </Box>
          </AuthProvider>
        </ChakraUIProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify({ firebaseConfig })}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main
      style={{
        paddingTop: "4rem",
        padding: "1rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ width: "100%", padding: "1rem", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
