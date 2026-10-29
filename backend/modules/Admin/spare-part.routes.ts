
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  getAdminSparePartRequests,
  reviewSparePartRequest,
} from "./spare-part.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/spare-part-requests", getAdminSparePartRequests);

router.patch(
  "/spare-part-requests/:id/review",
  reviewSparePartRequest,
);

export default router;
