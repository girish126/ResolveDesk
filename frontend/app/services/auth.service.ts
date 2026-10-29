
import { apiRequest, setAccessToken } from "@/app/lib/api";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/app/types/auth";
import { createUserWithEmailAndPassword, deleteUser, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export const authService = {
  async login(payload: LoginPayload) {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
    setAccessToken(response.accessToken ?? null);
    return {
      ...response,
      user: {
        ...response.user,
        role: response.user.role === "EMPLOYEE" ? "ENGINEER" : response.user.role,
      },
    };
  },

  async register(payload: RegisterPayload) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email.trim().toLowerCase(),
      payload.password,
    );
    try {
      await updateProfile(credential.user, { displayName: payload.name.trim() });
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: payload,
      });
      await signOut(auth);
      return response;
    } catch (error) {
      await deleteUser(credential.user).catch(() => undefined);
      await signOut(auth).catch(() => undefined);
      throw error;
    }
  },

  async me() {
    const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
      method: "GET",
    });
    return {
      ...response,
      user: {
        ...response.user,
        role: response.user.role === "EMPLOYEE" ? "ENGINEER" : response.user.role,
      },
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
