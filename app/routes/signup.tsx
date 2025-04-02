import React, { useState } from "react";
import {
  // json, // Use standard Response
  // redirect, // Use standard Response / client-side nav
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  useActionData,
  useNavigate,
} from "react-router";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { AuthForm } from "~/components/AuthForm";
import { useAuth } from "~/context/AuthContext";
import { getClientAuth } from "~/lib/firebase/firebase.client";
// import { getSession, commitSession } from '~/services/session.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  // Similar to login, check server session if implemented
  console.log(
    "Signup loader executed - checking auth state is client-side for now",
  );
  return {}; // Return empty object or Response
}

export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password are required." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  // Add password complexity validation if desired here or client-side
  if (password.length < 6) {
    return new Response(
      JSON.stringify({ error: "Password must be at least 6 characters long." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Note: Firebase sign-up happens client-side via AuthForm onSubmit.
  // Similar to login, this action could verify an ID token post-signup
  // and create a session, but we rely on the client flow for now.
  console.log(
    `Action attempt for signup: ${email} - Client handles actual sign-up.`,
  );

  // Acknowledge receipt. Client handles signup and navigation.
  return new Response(
    JSON.stringify({
      success: true,
      message: "Client should handle sign-up and redirect.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export default function SignupPage() {
  const actionData = useActionData() as
    | { error?: string; success?: boolean; message?: string }
    | undefined;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [clientError, setClientError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if user becomes authenticated (e.g., after successful signup)
  React.useEffect(() => {
    if (!authLoading && user) {
      console.log("User authenticated, redirecting from Signup page...");
      navigate("/"); // Redirect to home or dashboard
    }
  }, [user, authLoading, navigate]);

  const handleSignup = async (email: string, password: string) => {
    setClientError(null);
    setLoading(true);
    if (password.length < 6) {
      setClientError("Password must be at least 6 characters long.");
      setLoading(false);
      return; // Prevent Firebase call with short password
    }
    try {
      const auth = getClientAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      // No explicit navigation here; the useEffect hook watching `user` will handle it.
      console.log("Firebase sign-up successful (client-side)");
    } catch (error: any) {
      console.error("Firebase Signup Error:", error);
      let message = "Signup failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email address is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Please choose a stronger password.";
      }
      setClientError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthForm
        title="Create Account"
        buttonText="Sign Up"
        onSubmit={handleSignup}
        error={clientError || actionData?.error}
        loading={loading || authLoading}
      />
    </div>
  );
}
