import express from 'express';
const router = express.Router();

import customersAuthController from './customers.auth.controller.js';
import {
  authRequestSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
  logoutSchema,
  socialLoginSchema
} from './customers.auth.validator.js';
import validate from '../../../middlewares/validate.js';
import rateLimit from 'express-rate-limit';

/* ─── Rate Limiters ─────────────────────────────────────────── */

const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

// Strict limiter for OTP send/resend (prevents SMS flooding)
const otpLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 2 * 60 * 1000,
      max: 30,
      message: 'Too many OTP requests from this IP, please try again in 2 minutes.',
      standardHeaders: true,
      legacyHeaders: false
    });

// General auth limiter (verify, refresh, logout, social)
const authLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 2 * 60 * 1000,
      max: 50,
      message: 'Too many requests from this IP, please try again in 2 minutes.',
      standardHeaders: true,
      legacyHeaders: false
    });

/* ─── Routes (paths unchanged) ──────────────────────────────── */

/* ─── Routes (paths unchanged) ──────────────────────────────── */

// Consolidated Unified OTP request (New/Existing Users)
router.post('/request-otp', otpLimiter, validate(authRequestSchema), customersAuthController.requestOtp);

// OTP verification → issues access + refresh tokens
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), customersAuthController.verifyOtp);

// Resend OTP (with 30s cooldown enforced in service)
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), customersAuthController.resendOtp);

// Rotate refresh token
router.post('/refresh-token', authLimiter, validate(refreshSchema), customersAuthController.refreshToken);

// Logout (single device or all devices)
router.post('/logout', authLimiter, validate(logoutSchema), customersAuthController.logout);

// Social login (Google / Apple) with account linking
router.post('/social-login', authLimiter, validate(socialLoginSchema), customersAuthController.socialLogin);

export default router;
