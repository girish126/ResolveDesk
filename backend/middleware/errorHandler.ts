
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AuthError } from "../modules/Auth/auth.service.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({
      success: false,
      message: "The image upload is too large. Reduce the image size and try again.",
    });
    return;
  }

  // Log details on the server, not in the client response.
  console.error("Unhandled application error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
