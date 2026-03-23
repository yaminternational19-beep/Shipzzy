import express from 'express';
const router = express.Router();

import controller from './category.controller.js';
import validate from '../../middlewares/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.validator.js';

import upload from '../../middlewares/upload.middleware.js';

// GET categories
router.get("/", controller.getCategories);

// CREATE category
router.post("/",upload.single("image"),validate(createCategorySchema),controller.createCategory);

// UPDATE category
router.put("/:id",upload.single("image"),validate(updateCategorySchema),controller.updateCategory);

// DELETE category
router.delete("/:id", controller.deleteCategory);

// TOGGLE STATUS
router.patch("/:id/status", controller.toggleStatus);

export default router;