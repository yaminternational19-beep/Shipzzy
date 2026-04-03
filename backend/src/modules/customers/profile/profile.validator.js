import Joi from "joi";

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
    profile_image: Joi.string().uri().allow(null, "").optional(),
    default_address_id: Joi.number().integer().positive().allow(null).optional()
});

const addAddressSchema = Joi.object({
    address_name: Joi.string().max(50).required().messages({ "any.required": "address_name is required (e.g. Home, Office)" }),
    contact_person_name: Joi.string().max(100).optional(),
    contact_phone: Joi.string().max(20).optional(),
    address_line_1: Joi.string().max(255).required().messages({ "any.required": "address_line_1 is required" }),
    address_line_2: Joi.string().max(255).allow(null, "").optional(),
    landmark: Joi.string().max(255).allow(null, "").optional(),
    city: Joi.string().max(100).required().messages({ "any.required": "city is required" }),
    state: Joi.string().max(100).required().messages({ "any.required": "state is required" }),
    pincode: Joi.string().max(20).required().messages({ "any.required": "pincode is required" }),
    country: Joi.string().max(100).required().messages({ "any.required": "country is required" }),
    latitude: Joi.number().min(-90).max(90).required().messages({ "any.required": "latitude is required for delivery pinpointing" }),
    longitude: Joi.number().min(-180).max(180).required().messages({ "any.required": "longitude is required for delivery pinpointing" }),
    is_default: Joi.boolean().optional()
});

const updateAddressSchema = Joi.object({
    address_name: Joi.string().max(50).optional(),
    contact_person_name: Joi.string().max(100).optional(),
    contact_phone: Joi.string().max(20).optional(),
    address_line_1: Joi.string().max(255).optional(),
    address_line_2: Joi.string().max(255).allow(null, "").optional(),
    landmark: Joi.string().max(255).allow(null, "").optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    pincode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    is_default: Joi.boolean().optional()
});

export { updateProfileSchema, addAddressSchema, updateAddressSchema };
