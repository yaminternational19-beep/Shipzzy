import ApiResponse from '../../utils/apiResponse.js';
import service from './tier.service.js';

/* ===============================
   CREATE TIER
================================= */
export const createTier = async (req, res) => {
  try {

    const tier = await service.createTier(req.body);

    return ApiResponse.success(
      res,
      "Tier created successfully",
      tier
    );

  } catch (error) {

    return ApiResponse.error(
      res,
      error.message || "Failed to create tier"
    );

  }
};


/* ===============================
   GET TIERS
================================= */
export const getTiers = async (req, res) => {
  try {

    const result = await service.getTiers(req.query);

    return ApiResponse.success(
      res,
      "Tiers fetched successfully",
      result
    );

  } catch (error) {

    return ApiResponse.error(
      res,
      error.message || "Failed to fetch tiers"
    );

  }
};


/* ===============================
   UPDATE TIER
================================= */
export const updateTier = async (req, res) => {
  try {

    const tier = await service.updateTier(
      req.params.id,
      req.body
    );

    return ApiResponse.success(
      res,
      "Tier updated successfully",
      tier
    );

  } catch (error) {

    return ApiResponse.error(
      res,
      error.message || "Failed to update tier"
    );

  }
};


/* ===============================
   DELETE TIER
================================= */
export const deleteTier = async (req, res) => {
  try {

    const deleted = await service.deleteTier(req.params.id);

    return ApiResponse.success(
      res,
      "Tier deleted successfully",
      deleted
    );

  } catch (error) {

    return ApiResponse.error(
      res,
      error.message || "Failed to delete tier"
    );

  }
};

export default {
  createTier,
  getTiers,
  updateTier,
  deleteTier
};