import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  Text,
  Field,
} from "@chakra-ui/react";

interface AuthFormProps {
  title: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  buttonText: string;
  error?: string | null;
  loading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  buttonText,
  error,
  loading,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onSubmit(email, password);
    } catch (submitError: any) {
      console.error("AuthForm Submit Error:", submitError);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg">
      <Heading mb={6}>{title}</Heading>
      {error && (
        <Text color="red.500" mb={4}>
          {error}
        </Text>
      )}
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root id="email">
            <Field.Label htmlFor="email">Email address</Field.Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field.Root>
          <Field.Root id="password">
            <Field.Label htmlFor="password">Password</Field.Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </Field.Root>
          <Button
            type="submit"
            colorScheme="blue"
            loading={loading}
            disabled={loading}>
            {buttonText}
          </Button>
        </Stack>
      </form>
    </Box>
  );
};
