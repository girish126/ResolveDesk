
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { ApiError } from "@/app/lib/api";
import { getDashboardPath } from "@/app/lib/auth";
import { setDemoSession } from "@/app/lib/demo-store";
import { auth } from "@/app/lib/firebase";
import { authService } from "@/app/services/auth.service";

import { sendPasswordResetEmail } from "firebase/auth";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [notice, setNotice] = useState("");

  function loadRecentEmails() {
    try {
      const stored = window.localStorage.getItem("recent-auth-emails");
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      setRecentEmails(
        Array.isArray(parsed)
          ? parsed.filter(
              (value): value is string => typeof value === "string"
            )
          : []
      );
    } catch {
      setRecentEmails([]);
    }
  }

  function rememberEmail(value: string) {
    const normalizedEmail = value.trim().toLowerCase();
    if (!normalizedEmail) return;

    const updated = [
      normalizedEmail,
      ...recentEmails.filter((saved) => saved !== normalizedEmail),
    ].slice(0, 8);

    try {
      window.localStorage.setItem(
        "recent-auth-emails",
        JSON.stringify(updated)
      );
      setRecentEmails(updated);
    } catch {
      // Authentication should work even if browser storage is unavailable.
    }
  }

  function clearCredentials() {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      // Firebase password reset email.
      if (forgotMode) {
        await sendPasswordResetEmail(auth, normalizedEmail, {
          url: `${window.location.origin}/auth/login`,
          handleCodeInApp: false,
        });

        rememberEmail(normalizedEmail);

        setNotice(
          "If an account exists, a password reset email will be sent. Check your inbox and spam folder."
        );

        return;
      }

      // Validate signup passwords.
      if (isSignup && password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      // Signup through Express and PostgreSQL.
      if (isSignup) {
        await authService.register({
          name: name.trim(),
          email: normalizedEmail,
          password,
        });

        rememberEmail(normalizedEmail);
        clearCredentials();

        router.replace("/auth/login");
        return;
      }

      // Login through Express and PostgreSQL.
      const response = await authService.login({
        email: normalizedEmail,
        password,
      });

      rememberEmail(normalizedEmail);
      clearCredentials();

      setDemoSession(response.user);

      // Preserve the original ticket URL shared through WhatsApp.
      const requestedPath = new URLSearchParams(
        window.location.search
      ).get("redirect");

      const isSafeRedirect =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.includes("\\");

      const redirectPath =
        isSafeRedirect && requestedPath
          ? requestedPath
          : getDashboardPath(response.user.role);

      router.replace(redirectPath);
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError(
          forgotMode
            ? "Unable to send the reset email. Check your Firebase configuration."
            : "Unable to connect. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ResolveDesk
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSignup
              ? "Create your account"
              : forgotMode
                ? "Reset your password"
                : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {forgotMode
              ? "Enter your account email to request a password reset link."
              : isSignup
                ? "Sign up to start managing your complaints."
                : "Sign in to continue to your workspace."}
          </p>
        </div>

        <form
          method="post"
          onSubmit={handleSubmit}
          autoComplete="off"
          className="mt-7 space-y-5"
        >
          {isSignup && (
            <Input
              label="Full name"
              name="name"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}

          <Input
            label="Email address"
            type="email"
            autoComplete="off"
            list="recent-auth-emails"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onFocus={loadRecentEmails}
            required
          />

          <datalist id="recent-auth-emails">
            {recentEmails
              .filter((savedEmail) =>
                savedEmail.startsWith(normalizedEmailPrefix(email))
              )
              .map((savedEmail) => (
                <option key={savedEmail} value={savedEmail} />
              ))}
          </datalist>

          {!forgotMode && (
            <Input
              label="Password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 10 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          )}

          {isSignup && (
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {notice}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {forgotMode
              ? "Send reset link"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        {!isSignup && !forgotMode && (
          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setError("");
                setNotice("");
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>
        )}

        {forgotMode && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setError("");
                setNotice("");
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Back to sign in
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          {!forgotMode && (
            <>
              {isSignup
                ? "Already have an account?"
                : "New to ResolveDesk?"}{" "}
              <Link
                href={isSignup ? "/auth/login" : "/auth/signup"}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

function normalizedEmailPrefix(value: string) {
  return value.trim().toLowerCase();
}
