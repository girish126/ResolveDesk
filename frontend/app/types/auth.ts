
export type UserRole = "USER" | "ADMIN" | "ENGINEER" | "EMPLOYEE";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  message?: string;
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

export type TokenResponse = {
  success: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
};
