import Joi from "joi";

const authRequestSchema = Joi.object({
  country_code: Joi.string().required().messages({ "any.required": "Country code is required" }),
  mobile: Joi.string().min(8).max(15).required().messages({ "any.required": "Mobile number is required" }),
  name: Joi.string().optional(),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format"
  }),
  device_id: Joi.string().required().messages({ "any.required": "Device ID is required" }),
  player_id: Joi.string().required().messages({ "any.required": "Player ID is required" }),
  device_type: Joi.string().valid("android", "ios", "web").required().messages({
    "any.required": "device_type is required",
    "any.only": "device_type must be one of: android, ios, web"
  }),
  app_version: Joi.string().optional(),
  referral_code: Joi.string().optional()
});

const verifyOtpSchema = Joi.object({
  token: Joi.string().required().messages({ "any.required": "Session token is required" }),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    "any.required": "OTP is required",
    "string.length": "OTP must be exactly 6 digits",
    "string.pattern.base": "OTP must contain digits only"
  })
});

const resendOtpSchema = Joi.object({
  token: Joi.string().required().messages({ "any.required": "Session token is required" })
});

const refreshSchema = Joi.object({
  token: Joi.string().required().messages({ "any.required": "Refresh token is required" })
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "string.empty": "Refresh token is required",
    "any.required": "Refresh token is required"
  }),
  logoutAll: Joi.boolean().optional()
});

const socialLoginSchema = Joi.object({
  provider: Joi.string().valid("google", "apple").required(),
  provider_id: Joi.string().required(),
  email: Joi.string().email().required().messages({
    "any.required": "Social email is required",
    "string.email": "Invalid email format"
  }),
  name: Joi.string().optional(),
  profile_image: Joi.string().optional(),
  device_id: Joi.string().required(),
  player_id: Joi.string().required(),
  device_type: Joi.string().valid("android", "ios", "web").required().messages({
    "any.required": "device_type is required",
    "any.only": "device_type must be one of: android, ios, web"
  }),
  app_version: Joi.string().optional()
});

export { authRequestSchema, verifyOtpSchema, resendOtpSchema, refreshSchema, socialLoginSchema };