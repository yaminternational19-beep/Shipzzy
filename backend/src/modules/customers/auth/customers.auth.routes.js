import express from "express";
const router = express.Router();
import controller from "./customers.auth.controller.js";
import validate from "../../../middlewares/validate.js";
import { authRequestSchema, verifyOtpSchema, resendOtpSchema, refreshSchema, logoutSchema, socialLoginSchema } from "./customers.auth.validator.js";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";
const otpLimiter = isTest ? (req, res, next) => next() : rateLimit({ windowMs: 2 * 60 * 1000, max: 30, message: "Too many OTP requests, try again in 2 minutes.", standardHeaders: true, legacyHeaders: false });
const authLimiter = isTest ? (req, res, next) => next() : rateLimit({ windowMs: 2 * 60 * 1000, max: 50, message: "Too many requests, try again in 2 minutes.", standardHeaders: true, legacyHeaders: false });

router.post("/request-otp", otpLimiter, validate(authRequestSchema), controller.requestOtp);
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), controller.resendOtp);
router.post("/social-login", authLimiter, validate(socialLoginSchema), controller.socialLogin);
router.post("/refresh-token", authLimiter, validate(refreshSchema), controller.refreshToken);
router.post("/logout", authLimiter, validate(logoutSchema), controller.logout);

export default router;
