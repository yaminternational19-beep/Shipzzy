import ApiResponse from '../../../utils/apiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import asyncHandler from '../../../utils/asyncHandler.js';
import service from './customers.auth.service.js';

/* ═══════════════════════════════════════════════════════════════
   POST /signup  →  Unified OTP Request (signup + login merged)

   - Checks phone existence to determine purpose automatically
   - purpose = "login"  → if customer already exists
   - purpose = "signup" → if customer is new
═══════════════════════════════════════════════════════════════ */
export const requestOtp = asyncHandler(async (req, res) => {
  const {
    country_code,
    mobile,
    name,
    email,
    device_id,
    player_id,
    device_type,
    app_version,
    referral_code
  } = req.body;

  const { token, otp, purpose } = await service.requestOtp({
    country_code,
    mobile,
    name,
    email,
    device_id,
    player_id,
    device_type,
    app_version,
    referral_code
  });

  return ApiResponse.success(
    res,
    purpose === "login"
      ? "OTP sent. Welcome back!"
      : "OTP sent. Please verify to complete signup.",
    { token, otp, purpose }
  );
});

/* ═══════════════════════════════════════════════════════════════
   POST /verify-otp  →  Verify OTP → issue tokens
═══════════════════════════════════════════════════════════════ */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { token, otp } = req.body;

  // Validate session token
  const decoded = service.verifyToken(token);
  if (!decoded) {
    throw new ApiError(401, "Session expired or invalid. Please request OTP again.");
  }

  const full_phone = `${decoded.country_code}${decoded.mobile}`;

  // Verify OTP in DB (throws on failure)
  await service.verifyOtp(full_phone, otp, decoded.purpose, token);

  // Complete authentication → create/update customer, device, session
  const { accessToken, refreshToken, customer } = await service.completeOtpAuth(
    decoded,
    token,
    req.ip,
    req.get("User-Agent")
  );

  return ApiResponse.success(res, "Authentication successful", {
    accessToken,
    refreshToken,
    customer
  });
});

/* ═══════════════════════════════════════════════════════════════
   POST /resend-otp  →  Resend OTP (with cooldown + rate limit)
═══════════════════════════════════════════════════════════════ */
export const resendOtp = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const decoded = service.verifyToken(token);
  if (!decoded) {
    throw new ApiError(401, "Session expired or invalid. Please request OTP again.");
  }

  const full_phone = `${decoded.country_code}${decoded.mobile}`;

  const otp = await service.resendOtp(full_phone, decoded.purpose, token);

  return ApiResponse.success(res, "OTP resent successfully", { token, otp });
});

/* ═══════════════════════════════════════════════════════════════
   POST /refresh-token  →  Rotate refresh token
═══════════════════════════════════════════════════════════════ */
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const result = await service.refreshSession(token);

  return ApiResponse.success(res, "Token refreshed successfully", result);
});

/* ═══════════════════════════════════════════════════════════════
   POST /logout  →  Logout (single device or all devices)
═══════════════════════════════════════════════════════════════ */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken, logoutAll } = req.body;

  await service.logoutCustomer(refreshToken, logoutAll === true);

  return ApiResponse.success(
    res,
    logoutAll ? "Logged out from all devices" : "Logged out successfully"
  );
});

/* ═══════════════════════════════════════════════════════════════
   POST /social-login  →  Google / Apple (with account linking)
═══════════════════════════════════════════════════════════════ */
export const socialLogin = asyncHandler(async (req, res) => {
  const {
    provider,
    provider_id,
    email,
    name,
    profile_image,
    device_id,
    player_id,
    device_type,
    app_version
  } = req.body;

  const customer = await service.findOrCreateSocialCustomer({
    provider,
    provider_id,
    email,
    name,
    profile_image,
    device_id,
    player_id,
    device_type,
    app_version
  });

  const accessToken = service.generateAccessToken(customer);
  const refreshToken = service.generateRefreshToken(customer);

  await service.storeRefreshToken(
    customer.id,
    refreshToken,
    device_id,
    req.ip,
    req.get("User-Agent")
  );

  return ApiResponse.success(res, "Login successful", {
    accessToken,
    refreshToken,
    customer
  });
});

export default {
  requestOtp,
  verifyOtp,
  resendOtp,
  refreshToken,
  logout,
  socialLogin
};