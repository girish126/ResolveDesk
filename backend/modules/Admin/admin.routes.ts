
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getDashboardSummary,
  getAllTickets,
  getTicketById,
  getEngineers,
  assignTicket,
  getReportsSummary,
  getSparePartRequests,
  reviewSparePartRequest,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard/summary", getDashboardSummary);
router.get("/tickets", getAllTickets);
router.get("/tickets/:id", getTicketById);
router.get("/engineers", getEngineers);
router.patch("/tickets/:id/assign", assignTicket);
router.get("/reports/summary", getReportsSummary);
router.get("/spare-part-requests", getSparePartRequests);
router.patch("/spare-part-requests/:id/review", reviewSparePartRequest);

export default router;
