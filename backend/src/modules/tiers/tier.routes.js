// routes/tier.routes.js

import express from 'express';
const router = express.Router();

import controller from './tier.controller.js';
import validate from '../../middlewares/validate.js';
import { createTierSchema, updateTierSchema } from './tier.validator.js';

/* ===============================
   GET TIERS
================================= */
router.get("/", controller.getTiers);

/* ===============================
   CREATE TIER
================================= */
router.post(
  "/",
  validate(createTierSchema),
  controller.createTier
);

/* ===============================
   UPDATE TIER
================================= */
router.put(
  "/:id",
  validate(updateTierSchema),
  controller.updateTier
);

/* ===============================
   DELETE TIER
================================= */
router.delete("/:id", controller.deleteTier);

export default router;