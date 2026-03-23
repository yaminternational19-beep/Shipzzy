import express from 'express';
const router = express.Router();

import productController from './product.controller.js';
import { createProductSchema } from './product.validator.js';

import validate from '../../middlewares/validate.js'; // if created

router.post("/",validate(createProductSchema),productController.createProduct
);

router.get("/", productController.getAllProducts);

export default router;