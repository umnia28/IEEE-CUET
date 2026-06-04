import express from "express";
import {
  startSos,
  updateSosLocation,
  getTrackingLocation,
  resolveSos,
} from "../controllers/sosController.js";

import { protect } from "../middlewares/protect.js";

const router = express.Router();

router.post("/start", protect, startSos);
router.post("/:sosId/location", protect, updateSosLocation);
router.get("/track/:publicToken", getTrackingLocation);
router.post("/:sosId/resolve", protect, resolveSos);

export default router;