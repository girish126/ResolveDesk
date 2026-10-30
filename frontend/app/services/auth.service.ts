
import { apiRequest, setAccessToken } from "@/app/lib/api";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/app/types/auth";

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    role: user.role === "EMPLOYEE" ? "ENGINEER" : user.role,
  };
}

export const authService = {
  async login(payload: LoginPayload) {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: {
        ...payload,
        email: payload.email.trim().toLowerCase(),
      },
    });

    setAccessToken(response.accessToken ?? null);

    return {
      ...response,
      user: normalizeUser(response.user),
    };
  },

  async register(payload: RegisterPayload) {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: {
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
      },
    });

    return {
      ...response,
      user: normalizeUser(response.user),
    };
  },

  async me() {
    const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
      method: "GET",
    });

    return {
      ...response,
      user: normalizeUser(response.user),
    };
  },

  async logout() {
    try {
      return await apiRequest<{ message?: string }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
    }
  },
};
