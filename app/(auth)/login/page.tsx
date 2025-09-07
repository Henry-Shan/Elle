"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { login, type LoginActionState } from "../actions";
import { toast } from "@/components/toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  // Handle OAuth errors from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const errorMessage =
      error === "OAuthAccountNotLinked"
        ? "Please use the same provider you used to sign up"
        : "Failed to sign in";

    toast({ type: "error", description: errorMessage });
  }, [searchParams]);

  // Handle form submission states
  useEffect(() => {
    switch (state.status) {
      case "failed":
        toast({ type: "error", description: "Invalid credentials!" });
        break;
      case "invalid_data":
        toast({
          type: "error",
          description: "Failed validating your submission!",
        });
        break;
      case "success":
        setIsSuccessful(true);
        router.refresh();
        router.push("/chat");
        break;
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex flex-col min-h-dvh w-screen items-start py-12 md:items-center md:pt-0 justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col items-center gap-2 px-4 text-center sm:px-16">
          <h1 className="text-3xl font-semibold dark:text-zinc-50">Sign In</h1>
        </header>

        {/* OAuth Providers */}
        <section className="flex flex-col gap-3 px-4 sm:px-16">
          <OAuthButton
            provider="google"
            icon={<FcGoogle className="size-4" />}
            label="Continue with Google"
            className="bg-gray-50 text-gray-800 hover:bg-gray-200 border-gray-300"
          />

          <OAuthButton
            provider="github"
            icon={<FaGithub className="size-4" />}
            label="Continue with Github"
            className="bg-gray-50 text-gray-800 hover:bg-gray-200 border-gray-300"
          />
        </section>

        {/* Divider */}
        <Divider />

        {/* Email/Password Form */}
        <section>
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          </AuthForm>
        </section>

        {/* Footer Navigation */}
        <footer className="px-4 sm:px-16">
          <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

const OAuthButton = ({
  provider,
  icon,
  label,
  className = "hover:bg-gray-50",
}: {
  provider: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={() => signIn(provider, { callbackUrl: "/chat" })}
    className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 transition-colors border border-gray-300 dark:border-zinc-600 ${className}`}
  >
    {icon}
    {label}
  </button>
);

const Divider = () => (
  <div className="relative px-4 sm:px-16">
    <div className="absolute inset-0 flex items-center ">
      <div className="w-full border-t border-gray-300 dark:border-zinc-400" />
    </div>
    <div className="relative flex justify-center">
      <span className="px-2 bg-background  text-gray-600 dark:bg-zinc-300 text-sm">
        or
      </span>
    </div>
  </div>
);
