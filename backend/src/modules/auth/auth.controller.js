import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import authService from './auth.service.js';
import emailService from '../../services/emailService.js';

/* ===============================
   LOGIN
================================= */
export const login = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // find user from any role table
  const user = await authService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Email is incorrect");
  }

  // password verification
  const isPasswordValid = await authService.verifyPassword(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  if (user.status !== "active") {
    throw new ApiError(
      403,
      "Your account is inactive. Please contact the Super Admin."
    );
  }

  // generate OTP
  const otp = authService.generateOtp();

  // store OTP with correct role
  await authService.storeOtp(user.id, user.role, otp, "login");

  // send OTP email
  await emailService.sendLoginOtp(user.email, otp);

  // create login token
  const loginToken = authService.generateLoginToken(user);

  return ApiResponse.success(
    res,
    "OTP sent to registered email address",
    {
      login_token: loginToken,
      otp // remove in production
    }
  );

});

/* ===============================
   VERIFY LOGIN OTP
================================= */

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { login_token, otp } = req.body;

  if (!login_token || !otp) {
    throw new ApiError(400, "OTP and login token are required");
  }

  // decode login token
  const decoded = authService.verifyLoginToken(login_token);

  if (!decoded) {
    throw new ApiError(401, "Invalid or expired login session");
  }

  // verify OTP from database
  const isOtpValid = await authService.verifyOtp(
    decoded.id,
    decoded.role,
    otp,
    "login"
  );

  if (!isOtpValid) {
    throw new ApiError(401, "Invalid or expired OTP");
  }

  // generate tokens
  const accessToken = authService.generateAccessToken(decoded);
  const refreshToken = authService.generateRefreshToken(decoded);

  // store refresh token
  await authService.storeRefreshToken(decoded.id, decoded.role, refreshToken);

  return ApiResponse.success(res, "Login successful", {
    accessToken,
    refreshToken,
    role: decoded.role
  });
});

/* ===============================
   REFRESH TOKEN
================================= */

export const refreshToken = asyncHandler(async (req, res) => {

  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(400, "Refresh token required");
  }

  const newAccessToken = await authService.refreshAccessToken(token);

  if (!newAccessToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  return ApiResponse.success(res, "Token refreshed successfully", {
    accessToken: newAccessToken
  });

});

/* ===============================
   FORGOT PASSWORD
================================= */

export const forgotPassword = asyncHandler(async (req, res) => {

  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await authService.getUserByEmail(email);

  // Prevent email enumeration
  if (!user) {
    return ApiResponse.success(
      res,
      "If the email exists, OTP has been sent"
    );
  }

  const otp = authService.generateOtp();

  // store OTP in database
  await authService.storeOtp(user.id, user.role, otp, "reset");

  // send email
  await emailService.sendForgotPasswordOtp(user.email, otp);

  // create reset token
  const resetToken = authService.generateResetOtpToken(user);

  return ApiResponse.success(res, "OTP sent to registered email", {
    reset_token: resetToken,
    otp // remove in production
  });

});

/* ===============================
   VERIFY RESET OTP
================================= */

export const verifyResetOtp = asyncHandler(async (req, res) => {

  const { reset_token, otp } = req.body;

  if (!reset_token || !otp) {
    throw new ApiError(400, "Reset token and OTP required");
  }

  const decoded = authService.verifyLoginToken(reset_token);

  if (!decoded) {
    throw new ApiError(401, "Invalid or expired reset session");
  }

  const isOtpValid = await authService.verifyOtp(
    decoded.id,
    decoded.role,
    otp,
    "reset"
  );

  if (!isOtpValid) {
    throw new ApiError(401, "Invalid or expired OTP");
  }

  const resetSessionToken = authService.generateResetToken(decoded);

  return ApiResponse.success(res, "OTP verified successfully", {
    reset_token: resetSessionToken
  });

});

/* ===============================
   RESET PASSWORD
================================= */

export const resetPassword = asyncHandler(async (req, res) => {

  const { reset_token, new_password, confirm_password } = req.body;

  if (!reset_token) {
    throw new ApiError(400, "Reset session expired");
  }

  if (!new_password || !confirm_password) {
    throw new ApiError(400, "All fields are required");
  }

  if (new_password !== confirm_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  const decoded = authService.verifyLoginToken(reset_token);

  if (!decoded) {
    throw new ApiError(401, "Invalid reset session");
  }

  const result = await authService.resetPassword(
    decoded.id,
    decoded.role,
    new_password
  );

  if (!result) {
    throw new ApiError(400, "Password reset failed");
  }

  return ApiResponse.success(
    res,
    "Password reset successful, please login again"
  );

});

/* ===============================
   RESEND OTP
================================= */

export const resendOtp = asyncHandler(async (req, res) => {

  const { session_token } = req.body;

  if (!session_token) {
    throw new ApiError(400, "Session token required");
  }

  // verify token
  const decoded = authService.verifyLoginToken(session_token);

  if (!decoded) {
    throw new ApiError(401, "Invalid or expired session");
  }

  // generate new otp
  const otp = authService.generateOtp();

  // update existing otp row
  const updated = await authService.updateOtp(
    decoded.id,
    decoded.role,
    otp
  );

  if (!updated) {
    throw new ApiError(400, "OTP session not found");
  }

  // get user email
  const user = await authService.getUserById(decoded.id, decoded.role);

  // send email
  await emailService.sendLoginOtp(user.email, otp);

  return ApiResponse.success(res, "OTP resent successfully", {
    session_token,
    otp // remove in production
  });

});


export const logout = asyncHandler(async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token required");
  }

  const result = await authService.logout(refreshToken);

  if (!result) {
    throw new ApiError(400, "Invalid refresh token");
  }

  return ApiResponse.success(res, "Logged out successfully");

});

export default { login, verifyLoginOtp, refreshToken, forgotPassword, verifyResetOtp, resetPassword, resendOtp, logout };