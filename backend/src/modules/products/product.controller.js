import ApiResponse from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import productService from './product.service.js';

export const createProduct = asyncHandler(async (req, res) => {
  const product = productService.createProduct(req.body);

  return ApiResponse.success(res, "Product created successfully", product);
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const products = productService.getAllProducts();

  return ApiResponse.success(res, "Products fetched successfully", products);
});

export default { createProduct, getAllProducts };