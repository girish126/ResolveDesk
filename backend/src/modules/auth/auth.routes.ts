import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";

const authRouter = Router();

// Authentication endpoints are defined here so the API namespace exists while
// registration and login handlers are implemented.
authRouter.get("/me", authenticate, (_request, response) => {
  response.json({ user: response.locals.user });
});

export default authRouter;
