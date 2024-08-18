import express from "express";
import {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  getUserInvitations,
} from "../controllers/invitationController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createInvitation);
router.post("/accept/:invitationId", authMiddleware, acceptInvitation);
router.post("/decline/:invitationId", authMiddleware, declineInvitation);
router.get("/", authMiddleware, getUserInvitations);

export default router;
