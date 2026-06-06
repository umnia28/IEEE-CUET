import express from 'express';
import {protect} from '../middlewares/protect.js';

const router = express.Router();

import { updateUserLocation,checkCurrentLocationRisk, } from '../controllers/locationController.js';

router.post("/update", protect, updateUserLocation);
router.post("/risk-check", protect, checkCurrentLocationRisk);
export default router;



