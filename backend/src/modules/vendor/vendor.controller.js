import service from './vendor.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/* ===============================
   CREATE VENDOR
================================= */

export const createVendor = async (req, res) => {
    try {
        const vendor = await service.createVendor(req.body, req.files);
        return ApiResponse.success(res, "Vendor created successfully", vendor);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to create vendor");
    }
};

/* ===============================
   GET ALL VENDORS
================================= */

export const getAllVendors = async (req, res) => {
    try {
        const vendors = await service.getAllVendors(req.query);
        return ApiResponse.success(res, "Vendors fetched successfully", vendors);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to fetch vendors");
    }
};

/* ===============================
   GET VENDOR BY ID
================================= */

export const getVendorById = async (req, res) => {
    try {
        const vendor = await service.getVendorById(req.params.id);
        return ApiResponse.success(res, "Vendor fetched successfully", vendor);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to fetch vendor");
    }
};

/* ===============================
   UPDATE VENDOR
================================= */

export const updateVendor = async (req, res) => {
    try {
        const result = await service.updateVendor(req.params.id, req.body, req.files);
        return ApiResponse.success(res, "Vendor updated successfully", result);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to update vendor");
    }
};

/* ===============================
   UPDATE VENDOR STATUS
================================= */

export const updateStatus = async (req, res) => {
    try {
        const result = await service.updateStatus(req.params.id, req.body.status);
        return ApiResponse.success(res, "Vendor status updated successfully", result);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to update vendor status");
    }
};

/* ===============================
   UPDATE KYC STATUS
================================= */

export const updateKycStatus = async (req, res) => {
    try {
        const result = await service.updateKycStatus(req.params.id, req.body, req.user.id);
        return ApiResponse.success(res, "KYC status updated successfully", result);
    } catch (error) {
        return ApiResponse.error(res, error.message || "Failed to update KYC status");
    }
};

export default {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    updateStatus,
    updateKycStatus
};
