
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must not exceed 255 characters")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(72, "Password must not exceed 72 characters");

// Public registration: users cannot select their own role.
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must not exceed 120 characters"),

    email: emailSchema,

    password: passwordSchema,
  })
  .strict();

// Login
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password is required")
      .max(72, "Password is too long"),
  })
  .strict();

// TypeScript types inferred from the validated schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
