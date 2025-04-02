import React from "react";
import { Outlet } from "react-router";
import { Box, Heading } from "@chakra-ui/react";

// TODO: Add loader here to check for admin authentication
// export async function loader({ request, context }: LoaderFunctionArgs) {
//   // Check if user is logged in and has admin role
//   // If not, redirect to login or show unauthorized
//   return {};
// }

export default function AdminLayout() {
  return (
    <Box p={4}>
      <Heading as="h1" size="lg" mb={6}>
        Admin Panel
      </Heading>
      {/* Nested admin routes will render here */}
      <Outlet />
    </Box>
  );
}
