# React Router v7 + Vite + Cloudflare Pages + Chakra UI v3 + Firebase Setup Guide

This document details the specific configuration steps and potential pitfalls encountered when setting up a project using React Router v7 (with file-system routing), Vite, targeting Cloudflare Pages, and integrating Chakra UI v3 and Firebase Authentication.

## 1. Core Dependencies

Ensure the following key dependencies (and their related packages) are installed:

*   `react-router@^7.3.0` (Core)
*   `@react-router/cloudflare@^7.1.0` (Cloudflare adapter)
*   `@react-router/dev@^7.4.1` (Vite plugin, dev server, file routing helpers)
*   `@react-router/fs-routes@^7.1.1` (Required for `flatRoutes` convention)
*   `vite@^5.4.11`
*   `wrangler@^3.87.0`
*   `@chakra-ui/react@^3.15.0`
*   `firebase`
*   `firebase-admin`
*   `typescript`

*(See `package.json` for the full list)*

## 2. Vite Configuration (`vite.config.ts`)

Key settings to ensure compatibility, especially for SSR targeting Cloudflare Workers (`webworker`):

```typescript
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Define project root explicitly (helps plugin path resolution)
  root: ".",

  // Optional: tsconfig paths setup
  resolve: {
    // ... alias, extensions ...
  },

  ssr: {
    target: "webworker", // Target Cloudflare environment

    // CRITICAL: Prevent Vite from externalizing @react-router/dev
    // This helps resolve internal package specifiers (".", "./server")
    // that can fail during the SSR build for the webworker target.
    noExternal: [
      "@react-router/dev",
    ],

    // Define resolution conditions for package exports
    // Including 'import' and 'node' alongside 'workerd' and 'browser'
    // provides more potential entry points for Vite to find during SSR.
    resolve: {
      conditions: ["workerd", "browser", "import", "node"],
    },

    // Optional: optimizeDeps for SSR if needed
    optimizeDeps: { /* ... */ },
  },

  // Optional: Build configurations if needed
  build: { /* ... */ },

  // Optional: Server config if needed
  server: { /* ... */ },

  plugins: [
    // Cloudflare proxy for dev server
    cloudflareDevProxy(),

    // React Router Vite plugin (no arguments needed if root is set correctly)
    // This plugin enables HMR, file-system routing discovery, etc.
    reactRouter(),

    // Enable tsconfig paths (e.g., ~/, @/)
    tsconfigPaths(),
  ],
});
```

## 3. TypeScript Configuration (`tsconfig.json`)

Settings compatible with Vite, React Router v7, and modern module resolution:

```json
{
  "include": [ /* ... */ ],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],

    // Explicitly list only essential env types.
    // Avoid listing adapter types like '@react-router/cloudflare' here,
    // as it can sometimes interfere with TS finding types from other
    // related packages like '@react-router/dev'.
    "types": ["vite/client"],

    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",

    // CRITICAL: Use "NodeNext" for both module and moduleResolution
    // This is often required for compatibility with modern packages and Vite.
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "resolveJsonModule": true,
    "target": "ES2022",
    "strict": true,
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      // Define aliases used in the project
      "~/*": ["./app/*"],
      "@/*": ["./app/*"]
    },
    "noEmit": true, // Vite handles emit
    "rootDirs": [".", "./.react-router/types"] // Include generated types
  }
}

```

## 4. File-System Routing Setup

*   **Convention:** This setup uses the "flat routes" convention. Route files are placed directly in `app/routes/`.
    *   `app/routes/_index.tsx` -> `/`
    *   `app/routes/login.tsx` -> `/login`
    *   `app/routes/user.profile.tsx` -> `/user/profile`
    *   etc.
*   **Enabling File Routing (`app/routes.ts`):**
    *   The presence of this file is required by `@react-router/dev`.
    *   To enable the `flatRoutes` convention, explicitly import and export it:
        ```typescript
        import { type RouteConfig } from "@react-router/dev/routes";
        import { flatRoutes } from "@react-router/fs-routes";

        // Export the result of flatRoutes to enable the convention
        export default flatRoutes() satisfies RouteConfig;
        ```
    *   **Quirk:** Manually defining routes here (e.g., `[index("routes/home.tsx")]`) or exporting an empty array (`[]`) **will override or prevent** file-system routing from working correctly.

## 5. Server Entry Point (`app/entry.server.tsx`)

*   **Manual Rendering Required:** In this specific setup (likely due to the Cloudflare Pages template/adapter interaction with `@react-router/dev`), the automated request `handler` from `@react-router/dev/server` **did not work** and caused persistent module resolution errors (`Cannot find module`, `Missing "./server" specifier`).
*   **Solution:** The server entry point must manually perform SSR using `ServerRouter` and `renderToReadableStream`, similar to older React Router setups or setups without the `@react-router/dev` server component.
    ```typescript
    import type { AppLoadContext, EntryContext } from "react-router";
    import { ServerRouter } from "react-router";
    import { isbot } from "isbot"; // Optional, for bot detection
    import { renderToReadableStream } from "react-dom/server";

    export default async function handleRequest(
      request: Request,
      responseStatusCode: number,
      responseHeaders: Headers,
      routerContext: EntryContext,
      _loadContext: AppLoadContext,
    ): Promise<Response> {
      // The routerContext provided here contains the routes discovered
      // by the Vite plugin based on app/routes.ts (using flatRoutes).

      const body = await renderToReadableStream(
        // ServerRouter uses the provided context to render the correct route
        <ServerRouter context={routerContext} url={request.url} />,
        {
          onError(error: unknown) { /* ... error handling ... */ },
        },
      );

      // ... handle bot user agents, set headers, return Response ...
      responseHeaders.set("Content-Type", "text/html");
      return new Response(body, {
        headers: responseHeaders,
        status: responseStatusCode,
      });
    }
    ```

## 6. Route Modules (`app/routes/*.tsx`)

*   **Imports:** Import hooks (`useLoaderData`, `useActionData`, `useNavigate`, etc.) and types (`LoaderFunctionArgs`, `ActionFunctionArgs`) directly from the base `react-router` package.
    ```typescript
    import {
      type LoaderFunctionArgs,
      type ActionFunctionArgs,
      useActionData,
      useNavigate
    } from "react-router";
    ```
*   **Loaders/Actions:** Use standard Web API `Response` objects. Do not use the legacy `json()` or `redirect()` helpers from Remix/older React Router versions.
    ```typescript
    export async function action({ request }: ActionFunctionArgs): Promise<Response> {
      // ... get form data ...
      if (errorCondition) {
        return new Response(JSON.stringify({ error: "..." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    ```
*   **`useActionData` Type:** When returning standard `Response` objects, `useActionData` might have an inferred type of `unknown` or `any`. Use type assertions or runtime checks to safely access data:
    ```typescript
    const actionData = useActionData() as { error?: string; success?: boolean } | undefined;
    // Access as actionData?.error, actionData?.success
    ```

## 7. Chakra UI v3 Integration

*   **Provider:** The application must be wrapped in the Chakra UI `Provider` (usually generated by `npx @chakra-ui/cli snippet add` into `components/ui/provider.tsx`). Wrap this around your app layout in `app/root.tsx`.
    ```typescript
    // app/root.tsx
    import { Provider as ChakraUIProvider } from "~/components/ui/provider";
    // ...
    export function Layout({ children }) {
      return (
        <html>
          <body>
            <ChakraUIProvider>
              {/* Rest of your layout, AuthProvider, etc. */}
              {children}
            </ChakraUIProvider>
            {/* ... scripts ... */}
          </body>
        </html>
      );
    }
    ```
*   **Form Components:** Use the `Field` component (`Field.Root`, `Field.Label`, `Field.ErrorText`, etc.) instead of the older `FormControl`, `FormLabel`. Imports are directly from `@chakra-ui/react`.
*   **Stack Layout:** Use the `gap` prop for spacing (`<Stack gap={4}>`) instead of the older `spacing` prop.

## 8. Firebase Integration

*   **Client/Server Separation:** Maintain separate initialization logic for the client SDK (`firebase.client.ts`) and Admin SDK (`firebase.server.ts`).
*   **Client Initialization (`firebase.client.ts`):** Initialize using config passed from the server, often via `window.ENV`. Ensure this runs only client-side.
*   **Server Initialization (`firebase.server.ts`):** Initialize using service account JSON from secure environment variables. Handle potential property case differences (`projectId` vs `project_id`) between the official `ServiceAccount` type and typical JSON formats.
*   **Client-Side Only Functions:** Functions like `getClientAuth()` that rely on the client SDK or `window` **must not** be called during SSR. Call them inside event handlers (`onClick`, `onSubmit`) or `useEffect` hooks to ensure they run only in the browser. Calling them at the top level of a component rendered on the server (like a header) will cause errors.

## 9. Common Errors & Fixes

*   **`Missing "./server" specifier in "@react-router/dev"` / `Cannot find module '@react-router/dev/server'`:** This indicates Vite SSR failing to resolve the dev server handler. In this setup, the fix was to **not use the dev handler** in `app/entry.server.tsx` and instead rely on manual `ServerRouter` rendering (See Section 5). Adding `@react-router/dev` to `ssr.noExternal` in `vite.config.ts` was also necessary.
*   **`Cannot find module 'react-router'` / `Cannot find module '@react-router/cloudflare'`:** Often related to `tsconfig.json` issues. Ensure `module` and `moduleResolution` are set to `"NodeNext"`. Avoid listing specific router packages in `compilerOptions.types`. If persistent, try a clean install (`rm -rf node_modules package-lock.json && npm install`).
*   **`TypeError: Cannot destructure property 'X' of 'useLoaderData(...)' as it is undefined`:** Access loader data defensively in components rendered during SSR or error states: `const loaderData = useLoaderData(); const value = loaderData?.value ?? defaultValue;`.
*   **`Error [ContextError]: useContext returned undefined. Seems you forgot to wrap component within <ChakraProvider />`:** Ensure the Chakra UI `Provider` wraps the application layout in `app/root.tsx`.
*   **`No route matches URL "/favicon.ico"`:** Add a check in the root loader (`app/root.tsx`) to return a `204 No Content` response for `/favicon.ico` requests.
*   **Default React Router page showing at `/`:** Ensure `app/routes/_index.tsx` exists and that `app/routes.ts` is correctly configured for file-system routing (See Section 4). Ensure `app/entry.server.tsx` is correctly rendering the routes provided by the `routerContext` (See Section 5).

This guide reflects the specific steps and configurations required to make this combination of technologies work together successfully in this project's environment. 