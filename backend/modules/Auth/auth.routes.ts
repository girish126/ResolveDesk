
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  register,
  login,
  refresh,
  getMe,
  logout,
  adminCheck,
} from "./auth.controller.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh", refresh);

router.get("/me", authenticate, getMe);
router.post("/logout", logout);

router.get(
  "/admin-check",
  authenticate,
  authorize("ADMIN"),
  adminCheck
);

export default router;
