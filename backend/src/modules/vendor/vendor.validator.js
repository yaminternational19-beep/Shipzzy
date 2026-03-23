import Joi from 'joi';

/* ===============================
   CREATE VENDOR
================================= */

const createVendorSchema = Joi.object({
  business_name: Joi.string().required(),
  owner_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  country_code: Joi.string().required(),
  mobile: Joi.string().required(),
  emergency_country_code: Joi.string().optional(),
  emergency_mobile: Joi.string().optional(),
  business_categories: Joi.string().required(), // JSON string from frontend
  tier_id: Joi.number().required(),
  address: Joi.string().required(),
  country: Joi.string().required(),
  country_iso: Joi.string().required(),
  state: Joi.string().required(),
  state_iso: Joi.string().required(),
  city: Joi.string().required(),
  pincode: Joi.string().required(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  aadhar_number: Joi.string().required(),
  pan_number: Joi.string().required(),
  license_number: Joi.string().optional(),
  fassi_code: Joi.string().optional(),
  gst_number: Joi.string().optional(),
  bank_name: Joi.string().required(),
  account_name: Joi.string().required(),
  account_number: Joi.string().required(),
  ifsc: Joi.string().required(),
  total_turnover: Joi.string().allow('', null).optional()
});

/* ===============================
   UPDATE VENDOR
================================= */

const updateVendorSchema = Joi.object({
  business_name: Joi.string().optional(),
  owner_name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional().allow('', null),
  country_code: Joi.string().optional(),
  mobile: Joi.string().optional(),
  emergency_country_code: Joi.string().optional(),
  emergency_mobile: Joi.string().optional(),
  business_categories: Joi.string().optional(),
  tier_id: Joi.number().optional(),
  address: Joi.string().optional(),
  country: Joi.string().optional(),
  country_iso: Joi.string().optional(),
  state: Joi.string().optional(),
  state_iso: Joi.string().optional(),
  city: Joi.string().optional(),
  pincode: Joi.string().optional(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  aadhar_number: Joi.string().optional(),
  pan_number: Joi.string().optional(),
  license_number: Joi.string().optional(),
  fassi_code: Joi.string().optional(),
  gst_number: Joi.string().optional(),
  bank_name: Joi.string().optional(),
  account_name: Joi.string().optional(),
  account_number: Joi.string().optional(),
  ifsc: Joi.string().optional(),
  total_turnover: Joi.string().allow('', null).optional()
});

/* ===============================
   UPDATE STATUS
================================= */

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Active', 'Inactive').required()
});

/* ===============================
   UPDATE KYC STATUS
================================= */

const updateKycStatusSchema = Joi.object({
  kyc_status: Joi.string().valid('Approved', 'Rejected').required(),
  kyc_reject_reason: Joi.string().when('kyc_status', {
    is: 'Rejected',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  })
});

export { 
  createVendorSchema, 
  updateVendorSchema, 
  updateStatusSchema, 
  updateKycStatusSchema 
};