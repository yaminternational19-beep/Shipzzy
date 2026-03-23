import Joi from 'joi';

/* ===============================
   CREATE SUB ADMIN
================================= */

const createSubAdminSchema = Joi.object({

  name: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string().email().lowercase().required(),

  password: Joi.string()
    .min(6)
    .max(20)
    .required(),

  countryCode: Joi.string()
    .pattern(/^\+\d{1,4}$/)
    .required(),

  mobile: Joi.string()
    .pattern(/^[0-9]{6,15}$/)
    .required(),

  address: Joi.string().trim().max(500).required(),

  state: Joi.string().trim().required(),

  country: Joi.string().trim().required(),

  pincode: Joi.string().pattern(/^[0-9]{4,10}$/).allow(null, ""),

  emergencyCountryCode: Joi.string()
    .pattern(/^\+\d{1,4}$/)
    .allow(null, ""),

  emergencyMobile: Joi.string()
    .pattern(/^[0-9]{6,15}$/)
    .allow(null, ""),

  status: Joi.string().valid("Active", "Inactive").required(),

  role: Joi.string().valid("Sub Admin", "Finance", "Support").required()

}).unknown(true);

/* ===============================
   UPDATE SUB ADMIN
================================= */

const updateSubAdminSchema = Joi.object({

  name: Joi.string().min(3).max(100),

  email: Joi.string().email(),

  countryCode: Joi.string().pattern(/^\+\d+$/),

  mobile: Joi.string().pattern(/^[0-9]{6,15}$/),

  address: Joi.string().allow(null, ""),

  state: Joi.string().allow(null, ""),

  country: Joi.string().allow(null, ""),

  pincode: Joi.string().allow(null, ""),

  emergencyCountryCode: Joi.string()
    .pattern(/^\+\d+$/)
    .allow(null, ""),

  emergencyMobile: Joi.string()
    .pattern(/^[0-9]{6,15}$/)
    .allow(null, ""),

  role: Joi.string().valid("Sub Admin", "Finance", "Support"),

  status: Joi.string().valid("Active", "Inactive")

}).unknown(true);


/* ===============================
   UPDATE PERMISSIONS
================================= */

const updatePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
});




export { createSubAdminSchema, updateSubAdminSchema, updatePermissionsSchema, };