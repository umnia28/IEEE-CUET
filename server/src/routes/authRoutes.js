import express from 'express';
import {protect} from '../middlewares/protect.js';
import pool from '../config/db.js';
import { register, login,getMe } from '../controllers/authController.js';
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/protect/me", protect, getMe);

export default router;
