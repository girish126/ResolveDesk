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
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

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
          ? parsed.filter((value): value is string => typeof value === "string")
          : [],
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
      window.localStorage.setItem("recent-auth-emails", JSON.stringify(updated));
      setRecentEmails(updated);
    } catch {
      // Authentication should still succeed if browser storage is unavailable.
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

    if (forgotMode) {
      setLoading(true);
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const temporaryPassword = `${Array.from(
          window.crypto.getRandomValues(new Uint8Array(32)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("")}Aa1!`;

        // Older app accounts may exist in Postgres but not Firebase yet.
        // Create a Firebase credential only in that case, then immediately
        // send the reset link so the user can set the password they choose.
        try {
          await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            temporaryPassword,
          );
          await signOut(auth);
        } catch (provisionError) {
          const code =
            typeof provisionError === "object" && provisionError !== null && "code" in provisionError
              ? String(provisionError.code)
              : "";
          if (code !== "auth/email-already-in-use") throw provisionError;
        }

        await sendPasswordResetEmail(auth, email.trim(), {
          url: `${window.location.origin}/auth/login`,
          handleCodeInApp: false,
        });
        rememberEmail(email);
        setNotice("Reset link requested. Check your inbox and spam folder; Firebase sends a link, not a numeric code.");
      } catch (submitError) {
        const code =
          typeof submitError === "object" && submitError !== null && "code" in submitError
            ? String(submitError.code)
            : "";
        if (code === "auth/invalid-email") {
          setError("Enter a valid email address.");
        } else if (code === "auth/unauthorized-continue-uri" || code === "auth/unauthorized-domain") {
          setError("This website is not authorized for Firebase password reset. Add its domain in Firebase Authentication settings.");
        } else if (code === "auth/user-not-found") {
          setNotice("If an account exists for that email, Firebase will send a password reset link.");
        } else if (code === "auth/too-many-requests") {
          setError("Firebase temporarily blocked reset requests. Wait a few minutes and try again.");
        } else if (code === "auth/operation-not-allowed") {
          setError("Email/password sign-in is disabled. Enable it in Firebase Authentication settings.");
        } else if (code === "auth/network-request-failed") {
          setError("Network error while contacting Firebase. Check your connection and try again.");
        } else {
          setError("Unable to send a reset email. Check Firebase Authentication settings and try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await authService.register({ name: name.trim(), email: email.trim(), password });
        rememberEmail(email);
        clearCredentials();
        router.replace("/auth/login");
        return;
      }

      const response = await authService.login({ email: email.trim(), password });
      rememberEmail(email);
      clearCredentials();
      setDemoSession(response.user);
      const requestedPath = new URLSearchParams(window.location.search).get("redirect");
      const redirectPath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : getDashboardPath(response.user.role);
      router.replace(redirectPath);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof FirebaseError
            ? submitError.code === "auth/email-already-in-use"
              ? "An account already exists with this email. Sign in instead."
              : submitError.code === "auth/weak-password"
                ? "Choose a password with at least 10 characters."
                : "Firebase could not complete this request. Check your Firebase Authentication settings and try again."
            : "Unable to connect. Please check your connection and try again.",
      );
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
            {isSignup ? "Create your account" : forgotMode ? "Reset your password" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {forgotMode
              ? "Enter your account email. Firebase will email a reset link, not a numeric code."
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
                savedEmail.toLowerCase().startsWith(email.trim().toLowerCase()),
              )
              .map((savedEmail) => (
                <option key={savedEmail} value={savedEmail} />
              ))}
          </datalist>

          {!forgotMode && <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            minLength={isSignup ? 10 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />}

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

          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {forgotMode ? "Send reset link" : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        {!isSignup && !forgotMode && <div className="mt-3 text-right"><button type="button" onClick={() => { setForgotMode(true); setError(""); setNotice(""); }} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot password?</button></div>}
        {forgotMode && <div className="mt-3 text-center"><button type="button" onClick={() => { setForgotMode(false); setError(""); setNotice(""); }} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Back to sign in</button></div>}

        <p className="mt-6 text-center text-sm text-slate-600">
          {!forgotMode && <>{isSignup ? "Already have an account?" : "New to ResolveDesk?"}{" "}
          <Link
            href={isSignup ? "/auth/login" : "/auth/signup"}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
          </>}
        </p>
      </section>
    </main>
  );
}
