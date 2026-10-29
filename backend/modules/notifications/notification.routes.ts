import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
