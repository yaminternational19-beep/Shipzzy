import ApiResponse from '../../utils/apiResponse.js';
import service from './subadmin.service.js';
import { uploadFile, deleteFile } from '../../services/s3Service.js';

import bcrypt from 'bcryptjs';


export const getSubAdmins = async (req, res) => {
  try {
    const result = await service.getSubAdmins(req.query);
    return ApiResponse.success(res, "Sub admins fetched", result);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

export const getAccessLogs = async (req, res) => {
  try {

    const result = await service.getAccessLogs(req.query);

    return ApiResponse.success(
      res,
      "Access logs fetched successfully",
      result
    );

  } catch (error) {

    return ApiResponse.error(
      res,
      error.message || "Failed to fetch access logs"
    );

  }
};


export const createSubAdmin = async (req, res) => {

  try {

    let profilePhoto = null;
    let profilePhotoKey = null;

    if (req.file) {

      const uploadResult = await uploadFile(
        req.file,
        "sub-admins/profiles"
      );

      profilePhoto = uploadResult.url;
      profilePhotoKey = uploadResult.key;
    }

    /* hash password */
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const payload = {
      ...req.body,
      password: hashedPassword,
      profilePhoto,
      profilePhotoKey
    };

    const result = await service.createSubAdmin(payload);

    return ApiResponse.success(
      res,
      "Sub admin created successfully",
      result,
      201
    );

  } catch (err) {
    return ApiResponse.error(res, err.message);
  }

};

export const updateSubAdmin = async (req, res) => {
  try {

    const id = req.params.id;

    const existing = await service.getSubAdminById(id);

    if (!existing) {
      return ApiResponse.error(res, "Sub admin not found", 404);
    }

    let profilePhoto = existing.profile_photo;
    let profilePhotoKey = existing.profile_photo_key;

    /* handle image upload */
    if (req.file) {

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return ApiResponse.error(res, "Only JPG, JPEG, PNG images allowed", 400);
      }

      const uploadResult = await uploadFile(req.file, "sub-admins/profiles");

      profilePhoto = uploadResult.url;
      profilePhotoKey = uploadResult.key;
    }

    /* build update payload */
    const payload = {
      name: req.body.name || existing.name,
      email: req.body.email || existing.email,
      countryCode: req.body.countryCode || existing.country_code,
      mobile: req.body.mobile || existing.mobile,
      address: req.body.address || existing.address,
      state: req.body.state || existing.state,
      country: req.body.country || existing.country,
      pincode: req.body.pincode || existing.pincode,
      emergencyCountryCode:
        req.body.emergencyCountryCode || existing.emergency_country_code,
      emergencyMobile:
        req.body.emergencyMobile || existing.emergency_mobile,
      role: req.body.role || existing.role,
      status: req.body.status || existing.status,
      profilePhoto,
      profilePhotoKey
    };

    /* password update */
    if (req.body.password) {
      payload.password = await bcrypt.hash(req.body.password, 10);
    }

    /* update DB */
    const result = await service.updateSubAdmin(id, payload);

    /* delete old image AFTER successful DB update */
    if (req.file && existing.profile_photo_key) {
      try {
        await deleteFile(existing.profile_photo_key);
      } catch (err) {
        console.error("Old image deletion failed:", err.message);
      }
    }

    return ApiResponse.success(res, "Sub admin updated", result);

  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

export const toggleStatus = async (req, res) => {
  try {

    const result = await service.toggleStatus(req.params.id);

    if (!result) {
      return ApiResponse.error(res, "Sub admin not found", 404);
    }

    return ApiResponse.success(
      res,
      "Status updated successfully",
      result
    );

  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

export const deleteSubAdmin = async (req, res) => {
  try {

    const result = await service.deleteSubAdmin(req.params.id);

    if (result?.error) {
      return ApiResponse.error(res, result.error, 400);
    }

    return ApiResponse.success(
      res,
      "Sub admin deleted successfully"
    );

  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

export const updatePermissions = async (req, res) => {
  try {

    const result = await service.updatePermissions(
      req.params.id,
      req.body.permissions
    );

    if (!result) {
      return ApiResponse.error(res, "Sub admin not found", 404);
    }

    return ApiResponse.success(
      res,
      "Permissions updated successfully",
      result
    );

  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};


export default { getSubAdmins, getAccessLogs, createSubAdmin, updateSubAdmin, toggleStatus, deleteSubAdmin, updatePermissions };