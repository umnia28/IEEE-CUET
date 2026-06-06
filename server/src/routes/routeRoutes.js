import express from "express";
import { getSafeAlternativeRoutes } from "../controllers/routeController.js";
import { protect } from "../middlewares/protect.js";

const router = express.Router();

router.post("/safe-alternatives", protect, getSafeAlternativeRoutes);
router.get("/autocomplete", protect, autocompleteDestination);
export default router;