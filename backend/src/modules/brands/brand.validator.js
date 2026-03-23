import Joi from 'joi';

/* ===============================
   CREATE BRAND
================================= */

const createBrandSchema = Joi.object({
  name: Joi.string().required(),
  categoryId: Joi.number().required(),
  subCategoryId: Joi.number().required(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("Active", "Inactive").required()
});

/* ===============================
   UPDATE BRAND
================================= */

const updateBrandSchema = Joi.object({
  name: Joi.string().optional(),
  categoryId: Joi.number().optional(),
  subCategoryId: Joi.number().optional(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("Active", "Inactive").optional()
});

export { createBrandSchema, updateBrandSchema };