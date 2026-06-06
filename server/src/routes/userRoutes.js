import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);

router.patch(
  "/profile",
  protect,
  upload.single("photo"),
  updateUserProfile
);

export default router;