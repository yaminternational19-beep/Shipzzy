import Joi from "joi";

const authRequestSchema = Joi.object({
  country_code: Joi.string().required().messages({ "any.required": "country_code is required" }),
  mobile: Joi.string().min(8).max(15).required().messages({ "any.required": "mobile number is required" }),
  name: Joi.string().optional(),
  email: Joi.string().email().optional().messages({ "string.email": "Invalid email format" }),
  device_id: Joi.string().required().messages({ "any.required": "device_id is required" }),
  player_id: Joi.string().required().messages({ "any.required": "player_id is required" }),
  device_type: Joi.string().valid("android", "ios", "web").required().messages({ "any.required": "device_type is required", "any.only": "device_type must be android, ios, web" }),
  app_version: Joi.string().optional(),
  referral_code: Joi.string().optional()
});

const verifyOtpSchema = Joi.object({
  token: Joi.string().required().messages({ "any.required": "token is required" }),
  otp: Joi.string().length(6).required().messages({ "any.required": "otp is required", "string.length": "otp must be 6 digits" })
});

const resendOtpSchema = Joi.object({ token: Joi.string().required().messages({ "any.required": "token is required" }) });
const refreshSchema = Joi.object({ token: Joi.string().required().messages({ "any.required": "token is required" }) });
const logoutSchema = Joi.object({ refreshToken: Joi.string().required().messages({ "any.required": "refreshToken is required" }), logoutAll: Joi.boolean().optional() });

const socialLoginSchema = Joi.object({
  provider: Joi.string().valid("google", "apple").required().messages({ "any.required": "provider is required", "any.only": "provider must be google or apple" }),
  provider_id: Joi.string().required().messages({ "any.required": "provider_id is required" }),
  email: Joi.string().email().required().messages({ "any.required": "email is required", "string.email": "Invalid email format" }),
  name: Joi.string().optional(),
  profile_image: Joi.string().optional(),
  device_id: Joi.string().required().messages({ "any.required": "device_id is required" }),
  player_id: Joi.string().required().messages({ "any.required": "player_id is required" }),
  device_type: Joi.string().valid("android", "ios", "web").required().messages({ "any.required": "device_type is required", "any.only": "device_type must be android, ios, web" }),
  app_version: Joi.string().optional()
});

export { authRequestSchema, verifyOtpSchema, resendOtpSchema, refreshSchema, logoutSchema, socialLoginSchema };