import React from 'react';
import {
  isRouteErrorResponse,
  Outlet,
  useRouteError
} from "react-router-dom";
import { ChakraProvider, Box, Heading, Text, Code, defaultSystem } from '@chakra-ui/react';

import "./app.css";

export function Layout({ children }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <main>
        {children ? children : <Outlet />}
      </main>
    </ChakraProvider>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 Not Found" : `Error ${error.status}`;
    details = error.statusText || error.data?.message || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Layout>
      <Box p={5}>
        <Heading as="h1" size="xl" mb={4}>{message}</Heading>
        <Text fontSize="lg" mb={4}>{details}</Text>
        {stack && (
          <Box p={4} bg="gray.100" overflowX="auto">
            <Code>{stack}</Code>
          </Box>
        )}
      </Box>
    </Layout>
  );
} 