import express from 'express';
import controller from './vendor.controller.js';
import validate from '../../middlewares/validate.js';
import { 
    createVendorSchema, 
    updateVendorSchema, 
    updateStatusSchema, 
    updateKycStatusSchema 
} from './vendor.validator.js';
import upload from '../../middlewares/upload.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

const vendorUpload = upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'aadhar_doc', maxCount: 1 },
    { name: 'pan_doc', maxCount: 1 },
    { name: 'license_doc', maxCount: 1 },
    { name: 'fassi_doc', maxCount: 1 },
    { name: 'gst_doc', maxCount: 1 }
]);

/* ===============================
   VENDORS
================================= */

router.post("/", vendorUpload, validate(createVendorSchema), controller.createVendor);
router.get("/", controller.getAllVendors);
router.get("/:id", controller.getVendorById);
router.put("/:id", vendorUpload, validate(updateVendorSchema), controller.updateVendor);
router.patch("/:id/status", validate(updateStatusSchema), controller.updateStatus);
router.patch("/:id/kyc", authMiddleware, validate(updateKycStatusSchema), controller.updateKycStatus);

export default router;