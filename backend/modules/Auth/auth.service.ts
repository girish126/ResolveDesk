import { randomBytes, randomUUID, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/config/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

const ACCESS_TOKEN_TTL = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
if (!Number.isInteger(ACCESS_TOKEN_TTL) || ACCESS_TOKEN_TTL <= 0) {
  throw new Error("ACCESS_TOKEN_TTL_SECONDS must be a positive integer");
}
const FIREBASE_AUTH_TIMEOUT_MS = 15_000;
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function secret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }
  return name === "JWT_ACCESS_SECRET"
    ? "local-development-access-secret-change-before-deploy-2026"
    : "local-development-refresh-secret-change-before-deploy-2026";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createAccessToken(userId: string, familyId: string): string {
  return jwt.sign({ type: "access", familyId }, secret("JWT_ACCESS_SECRET"), {
    algorithm: "HS256",
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

async function createRefreshToken(
  userId: string,
  familyId: string = randomUUID(),
) {
  const token = randomBytes(48).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash, userId, familyId, expiresAt },
  });

  return { token, tokenHash, familyId };
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    return await prisma.user.create({
      data: { name: input.name, email, passwordHash },
      select: publicUserSelect,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new AuthError(409, "Unable to register with these details");
    }
    throw error;
  }
}

export async function loginWithTokens(input: LoginInput) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_WEB_API_KEY is not configured");

  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AuthError(401, "Invalid email or password");
  }

  let firebaseResponse: globalThis.Response;
  try {
    firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: input.password,
          returnSecureToken: false,
        }),
        signal: AbortSignal.timeout(FIREBASE_AUTH_TIMEOUT_MS),
      },
    );
  } catch {
    throw new AuthError(
      503,
      "Firebase sign-in could not be completed. Check the backend connection and try again.",
    );
  }

  if (!firebaseResponse.ok) {
    const firebaseError = (await firebaseResponse.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    const code = firebaseError?.error?.message;

    if (["EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS"].includes(code ?? "")) {
      // Migrate pre-Firebase accounts only when their existing database
      // password is correct. Firebase remains authoritative once the account
      // exists there, so a Firebase password reset invalidates the old one.
      const legacyPasswordMatches = await bcrypt.compare(input.password, user.passwordHash);
      if (!legacyPasswordMatches) {
        throw new AuthError(401, "Invalid email or password");
      }

      let migrationResponse: globalThis.Response;
      try {
        migrationResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: input.password, returnSecureToken: false }),
            signal: AbortSignal.timeout(FIREBASE_AUTH_TIMEOUT_MS),
          },
        );
      } catch {
        throw new AuthError(
          503,
          "Could not connect to Firebase to complete this account sign-in. Please try again.",
        );
      }

      if (!migrationResponse.ok) {
        const migrationError = (await migrationResponse.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        if (migrationError?.error?.message === "EMAIL_EXISTS") {
          throw new AuthError(401, "This account already has a Firebase password. Use Forgot password if it has changed.");
        }
        console.error("Firebase legacy account migration failed:", migrationError?.error?.message ?? "unknown error");
        throw new AuthError(503, "Could not migrate this account to Firebase. Check Firebase Authentication settings.");
      }
    } else if (code === "USER_DISABLED") {
      throw new AuthError(401, "This account is disabled in Firebase");
    } else {
      console.error("Firebase password verification failed:", code ?? "unknown error");
      throw new AuthError(503, "Unable to verify credentials. Check Firebase Authentication settings.");
    }
  }

  const refresh = await createRefreshToken(user.id);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken: createAccessToken(user.id, refresh.familyId),
    refreshToken: refresh.token,
  };
}

export async function refreshTokens(token: string) {
  const currentHash = hashToken(token);
  const current = await prisma.refreshToken.findUnique({ where: { tokenHash: currentHash } });
  if (!current) throw new AuthError(401, "Invalid refresh token. Please log in again.");

  if (current.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: current.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthError(401, "Refresh token reuse detected. Please log in again.");
  }
  if (current.expiresAt <= new Date()) {
    await prisma.refreshToken.update({ where: { id: current.id }, data: { revokedAt: new Date() } });
    throw new AuthError(401, "Refresh token expired. Please log in again.");
  }

  const user = await prisma.user.findUnique({
    where: { id: current.userId },
    select: { id: true, isActive: true },
  });
  if (!user?.isActive) {
    await prisma.refreshToken.updateMany({
      where: { familyId: current.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthError(401, "Account not found or inactive");
  }

  const replacement = await createRefreshToken(user.id, current.familyId);
  const rotated = await prisma.refreshToken.updateMany({
    where: { id: current.id, revokedAt: null },
    data: { revokedAt: new Date(), replacedByTokenHash: replacement.tokenHash },
  });
  if (rotated.count !== 1) {
    await prisma.refreshToken.updateMany({
      where: { familyId: current.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthError(401, "Refresh token has already been used");
  }

  return {
    accessToken: createAccessToken(user.id, current.familyId),
    refreshToken: replacement.token,
  };
}

export async function logoutRefreshToken(token: string) {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { familyId: true },
  });
  if (!tokenRecord) return;

  await prisma.refreshToken.updateMany({
    where: { familyId: tokenRecord.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function isRefreshFamilyActive(familyId: string): Promise<boolean> {
  const activeToken = await prisma.refreshToken.findFirst({
    where: {
      familyId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return activeToken !== null;
}

export async function getSafeUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
}
