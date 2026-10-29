
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createTicket,
  getMyTickets,
  getMyProfile,
} from "./user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.post("/tickets", createTicket);
router.get("/tickets", getMyTickets);

export default router;
