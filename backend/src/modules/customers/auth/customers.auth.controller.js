import ApiResponse from "../../../utils/apiResponse.js";
import ApiError from "../../../utils/ApiError.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import authService from "./customers.auth.service.js";

const requestOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestOtp(req.body);
  return ApiResponse.success(res, "OTP sent successfully", result);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { token, otp } = req.body;
  const decoded = authService.verifyToken(token);
  if (!decoded) throw new ApiError(401, "Invalid or expired session token");
  await authService.verifyOtp(decoded.full_phone, otp, decoded.purpose, token);
  const result = await authService.completeOtpAuth(decoded, token, req.ip, req.headers["user-agent"]);
  return ApiResponse.success(res, "Login successful", result);
});

const resendOtp = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const decoded = authService.verifyToken(token);
  if (!decoded) throw new ApiError(401, "Invalid session token");
  const newOtp = await authService.resendOtp(decoded.full_phone, decoded.purpose, token);
  return ApiResponse.success(res, "OTP resent successfully", { token, otp: newOtp });
});

const socialLogin = asyncHandler(async (req, res) => {
  const socialData = req.body;
  const customer = await authService.findOrCreateSocialCustomer(socialData);
  const accessToken = authService.generateAccessToken(customer);
  const refreshToken = authService.generateRefreshToken(customer);
  await authService.storeRefreshToken(customer.id, refreshToken, socialData.device_id, req.ip, req.headers["user-agent"]);
  return ApiResponse.success(res, "Social login successful", { accessToken, refreshToken, customer });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.refreshSession(token);
  return ApiResponse.success(res, "Token refreshed successfully", result);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken, logoutAll } = req.body;
  await authService.logoutCustomer(refreshToken, logoutAll);
  return ApiResponse.success(res, "Logged out successfully");
});

export default { requestOtp, verifyOtp, resendOtp, socialLogin, refreshToken, logout };