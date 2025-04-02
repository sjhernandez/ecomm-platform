import React, { useState } from "react";
import {
  // json, // Removed
  // redirect, // Removed
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  useActionData,
  useNavigate,
} from "react-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { AuthForm } from "~/components/AuthForm"; // Use tsconfig path
import { useAuth } from "~/context/AuthContext"; // Use tsconfig path
import { getClientAuth } from "~/lib/firebase/firebase.client"; // Use tsconfig path
// import { getSession, commitSession } from '~/services/session.server'; // Placeholder for server session

export async function loader({ request, context }: LoaderFunctionArgs) {
  // TODO: Check server-side session here. If user is logged in, redirect.
  // const session = await getSession(request.headers.get('Cookie'));
  // if (session.has('userId')) {
  //   return redirect('/'); // Or dashboard
  // }
  console.log(
    "Login loader executed - checking auth state is client-side for now",
  );
  // Return empty object or standard Response - trying empty obj first
  return {};
}

export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<Response> {
  // Explicitly return Promise<Response>
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    // Return standard Response for error
    return new Response(
      JSON.stringify({ error: "Email and password are required." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Note: Firebase sign-in happens client-side using the AuthForm's onSubmit.
  // This action *could* potentially verify the ID token sent from the client
  // after successful login and create a server-side session, but for now,
  // we'll rely on the client-side flow and the AuthContext listener.
  // Let's return a placeholder success or trigger client-side logic confirmation.
  console.log(
    `Action attempt for email: ${email} - Client handles actual sign-in.`,
  );

  // In a real scenario, you might:
  // 1. Client signs in via Firebase SDK (handled by AuthForm onSubmit).
  // 2. Client gets ID token.
  // 3. Client sends ID token to this Remix action.
  // 4. Server action verifies ID token using Firebase Admin SDK.
  // 5. Server action creates a session cookie.
  // 6. Server action returns success/redirect with the session cookie set.

  // For now, just acknowledge receipt. Client navigation is handled onSubmit success.
  // Return standard Response for success acknowledgement
  return new Response(
    JSON.stringify({
      success: true,
      message: "Client should handle sign-in and redirect.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export default function LoginPage() {
  // actionData will likely be the parsed JSON body from the Response
  const actionData = useActionData() as
    | { error?: string; success?: boolean; message?: string }
    | undefined;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Use auth state if needed
  const [clientError, setClientError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if user becomes authenticated (e.g., after successful login)
  React.useEffect(() => {
    if (!authLoading && user) {
      console.log("User authenticated, redirecting from Login page...");
      navigate("/"); // Redirect to home or dashboard
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (email: string, password: string) => {
    setClientError(null);
    setLoading(true);
    try {
      const auth = getClientAuth(); // Ensure Firebase client is initialized
      await signInWithEmailAndPassword(auth, email, password);
      // No explicit navigation here; the useEffect hook watching `user` will handle it.
      console.log("Firebase sign-in successful (client-side)");
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      // Map Firebase error codes to user-friendly messages
      let message = "Login failed. Please check your credentials.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        message = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      setClientError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthForm
        title="Login"
        buttonText="Log In"
        onSubmit={handleLogin}
        // Access error property from actionData
        error={clientError || actionData?.error}
        loading={loading || authLoading}
      />
    </div>
  );
}
