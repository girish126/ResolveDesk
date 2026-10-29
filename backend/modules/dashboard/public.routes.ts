import { Router } from "express";
import { getDashboardSummary } from "./dashboard.controller.js";

const router = Router();

// The landing page only needs aggregate counts; this endpoint exposes no ticket or user details.
router.get("/summary", getDashboardSummary);

export default router;
