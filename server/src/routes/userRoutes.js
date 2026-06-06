import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

import { protect } from "../middlewares/protect.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);

router.patch(
  "/profile",
  protect,
  upload.single("photo"),
  updateUserProfile
);

export default router;