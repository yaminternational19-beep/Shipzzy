import express from 'express';
const router = express.Router();

import controller from './subadmin.controller.js';
import { createSubAdminSchema,
  updateSubAdminSchema,
  updatePermissionsSchema, } from './subadmin.validator.js';
import upload from '../../middlewares/upload.middleware.js';
import validate from '../../middlewares/validate.js';

/* ===============================
   GET SUB ADMINS
================================= */
router.get("/", controller.getSubAdmins);

router.get("/logs", controller.getAccessLogs);


/* ===============================
   CREATE SUB ADMIN
================================= */
router.post("/",upload.single("profilePhoto"),validate(createSubAdminSchema),controller.createSubAdmin);


/* ===============================
   UPDATE SUB ADMIN
================================= */
router.put("/:id",upload.single("profilePhoto"),validate(updateSubAdminSchema),controller.updateSubAdmin);


/* ===============================
   DELETE SUB ADMIN
================================= */
router.delete("/:id", controller.deleteSubAdmin);


/* ===============================
   TOGGLE STATUS
================================= */
router.patch("/:id/status",controller.toggleStatus);


/* ===============================
   UPDATE PERMISSIONS
================================= */
router.patch("/:id/permissions",validate(updatePermissionsSchema),controller.updatePermissions);



export default router;

