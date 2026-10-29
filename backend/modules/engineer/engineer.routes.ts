import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getAssignedTickets,
  getAssignedTicketById,
  startTicketWork,
  submitTicketResponse,
  getSparePartRequests,
  createSparePartRequest,
} from "./engineer.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ENGINEER", "EMPLOYEE"));

router.get("/tickets", getAssignedTickets);
router.get("/tickets/:id", getAssignedTicketById);

router.patch("/tickets/:id/start", startTicketWork);
router.post("/tickets/:id/respond", submitTicketResponse);

router.get("/spare-part-requests", getSparePartRequests);
router.post("/spare-part-requests", createSparePartRequest);

export default router;