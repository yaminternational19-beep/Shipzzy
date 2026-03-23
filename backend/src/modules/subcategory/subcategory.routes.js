import express from 'express';
const router = express.Router();

import controller from './subcategory.controller.js';
import validate from '../../middlewares/validate.js';

import { createSubCategorySchema,updateSubCategorySchema } from './subcategory.validator.js';

import upload from '../../middlewares/upload.middleware.js';

/* ===============================
   GET SUBCATEGORIES
================================= */

router.get("/", controller.getSubCategories);

/* ===============================
   CREATE SUBCATEGORY
================================= */

router.post("/",upload.single("image"),validate(createSubCategorySchema),controller.createSubCategory);

/* ===============================
   UPDATE SUBCATEGORY
================================= */

router.put("/:id",upload.single("image"),validate(updateSubCategorySchema),controller.updateSubCategory);

/* ===============================
   DELETE SUBCATEGORY
================================= */

router.delete("/:id", controller.deleteSubCategory);

/* ===============================
   TOGGLE STATUS
================================= */

router.patch("/:id/status", controller.toggleStatus);

export default router;