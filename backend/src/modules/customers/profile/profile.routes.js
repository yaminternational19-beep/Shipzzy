import express from "express";
const router = express.Router();
import profileController from "./profile.controller.js";
import { updateProfileSchema, addAddressSchema, updateAddressSchema } from "./profile.validator.js";
import customerAuthMiddleware from "../../../middlewares/customer.auth.middleware.js";
import validate from "../../../middlewares/validate.js";
import upload from "../../../middlewares/upload.middleware.js";

router.get("/", customerAuthMiddleware, profileController.getProfile);
router.put("/", customerAuthMiddleware, upload.single("profile_image"), validate(updateProfileSchema), profileController.updateProfile);

router.post("/address", customerAuthMiddleware, validate(addAddressSchema), profileController.addAddress);
router.put("/address/:id", customerAuthMiddleware, validate(updateAddressSchema), profileController.updateAddress);
router.delete("/address/:id", customerAuthMiddleware, profileController.deleteAddress);

export default router;
