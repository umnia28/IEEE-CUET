import express from 'express';
import {protect} from '../middlewares/protect.js';

const router = express.Router();

import { updateUserLocation } from '../controllers/locationController.js';
router.post("/update", protect, updateUserLocation);

export default router;