import express from 'express';
const router = express.Router();

import controller from './brand.controller.js';
import validate from '../../middlewares/validate.js';

import { createBrandSchema,updateBrandSchema } from './brand.validator.js';

import upload from '../../middlewares/upload.middleware.js';

/* ===============================
   GET BRANDS
================================= */

router.get("/", controller.getBrands);

/* ===============================
   CREATE BRAND
================================= */

router.post("/",upload.single("image"),validate(createBrandSchema),controller.createBrand);

/* ===============================
   UPDATE BRAND
================================= */

router.put("/:id",upload.single("image"),validate(updateBrandSchema),controller.updateBrand);

/* ===============================
   DELETE BRAND
================================= */

router.delete("/:id", controller.deleteBrand);

/* ===============================
   TOGGLE STATUS
================================= */

router.patch("/:id/status", controller.toggleStatus);

export default router;