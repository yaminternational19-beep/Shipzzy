import express from "express";
const router = express.Router();

import ApiResponse from "../../utils/apiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import pool from "../../config/db.js";

// Example route
router.get("/health", (req, res) => {
  res.json({ success: true, message: "API v1 is working" });
});

router.get(
  "/test-success",
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, "API working properly", {
      version: "v1"
    });
  })
);

router.get(
  "/test-error",
  asyncHandler(async (req, res) => {
    throw new ApiError(400, "This is a test error", "TEST_ERROR");
  })
);

router.get(
  "/test-db",
  asyncHandler(async (req, res) => {

    const [rows] = await pool.query("SELECT NOW() AS time");

    return ApiResponse.success(res, "Database connected successfully", {
      serverTime: rows[0].time
    });

  })
);



import productRoutes from '../../modules/products/product.routes.js';

router.use("/products", productRoutes);


import authRoutes from '../../modules/auth/auth.routes.js';

router.use("/auth", authRoutes);

import subadmins from '../../modules/subadmins/subadmin.routes.js';

router.use("/subadmin", subadmins);

import categoryRoutes from '../../modules/categories/category.routes.js';

router.use("/categories", categoryRoutes);


import subCategoryRoutes from '../../modules/subcategory/subcategory.routes.js';

router.use("/subcategories", subCategoryRoutes);


import brandRoutes from '../../modules/brands/brand.routes.js';

router.use("/brands", brandRoutes);


import tierRoutes from '../../modules/tiers/tier.routes.js';

router.use("/tiers", tierRoutes);


import vendorRoutes from '../../modules/vendor/vendor.routes.js';

router.use("/vendors", vendorRoutes);


export default router;