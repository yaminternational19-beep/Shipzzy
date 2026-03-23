import Joi from 'joi';

/* ===============================
   LOGIN
================================= */

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

/* ===============================
   VERIFY LOGIN OTP
================================= */

const verifyLoginOtpSchema = Joi.object({
  login_token: Joi.string().required(),
  otp: Joi.string().length(6).required()
});

/* ===============================
   REFRESH TOKEN
================================= */

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/* ===============================
   FORGOT PASSWORD
================================= */

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

/* ===============================
   VERIFY RESET OTP
================================= */

const verifyResetOtpSchema = Joi.object({
  reset_token: Joi.string().required(),
  otp: Joi.string().length(6).required()
});

/* ===============================
   RESET PASSWORD
================================= */

const resetPasswordSchema = Joi.object({
  reset_token: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords do not match"
    })
});

/* ===============================
   RESEND OTP
================================= */

const resendOtpSchema = Joi.object({
  session_token: Joi.string().required()
});

export { loginSchema, verifyLoginOtpSchema, refreshSchema, forgotPasswordSchema, verifyResetOtpSchema, resetPasswordSchema, resendOtpSchema };