import ApiResponse from "../../../utils/apiResponse.js";
import ApiError from "../../../utils/ApiError.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import profileService from "./profile.service.js";

const getProfile = asyncHandler(async (req, res) => {
  const customerId = req.user.id;

  const customer = await profileService.getCustomerById(customerId);
  if (!customer) throw new ApiError(404, "Customer not found");

  const addresses = await profileService.getAddresses(customerId);

  // Calculate profile completion
  const profileCompletion = profileService.calculateProfileCompletion(customer, addresses);

  // Add inside customer object
  customer.profile_completion = profileCompletion;

  return ApiResponse.success(res, "Profile fetched successfully", {
    customer,
    addresses
  });
});


const updateProfile = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const updateData = req.body;
  const imageFile = req.file;
  const updatedCustomer = await profileService.updateProfile(customerId, updateData, imageFile);
  return ApiResponse.success(res, "Profile updated successfully", { customer: updatedCustomer });
});

const addAddress = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const addresses = await profileService.addAddress(customerId, req.body);
  return ApiResponse.success(res, "Address added successfully", { addresses });
});

const updateAddress = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const addresses = await profileService.updateAddress(customerId, req.params.id, req.body);
  return ApiResponse.success(res, "Address updated successfully", { addresses });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const addresses = await profileService.deleteAddress(customerId, req.params.id);
  return ApiResponse.success(res, "Address deleted successfully", { addresses });
});

export default { getProfile, updateProfile, addAddress, updateAddress, deleteAddress };
