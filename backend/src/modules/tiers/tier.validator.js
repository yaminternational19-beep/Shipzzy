import Joi from 'joi';

/* ===============================
   CREATE TIER
================================= */

const createTierSchema = Joi.object({
  tier_key: Joi.string().required(),
  tier_name: Joi.string().required(),
  tier_order: Joi.number().required(),
  threshold_text: Joi.string().allow(""),
  min_turnover: Joi.number().required(),
  commission_percent: Joi.number().required(),
  payment_cycle: Joi.string().allow(""),
  priority_listing: Joi.boolean().optional(),
  color_code: Joi.string().allow(""),
  badge_color: Joi.string().allow(""),
  features: Joi.array().items(Joi.string()).optional(),
  is_active: Joi.boolean().optional()
});


/* ===============================
   UPDATE TIER
================================= */

const updateTierSchema = Joi.object({
  tier_key: Joi.string().optional(),
  tier_name: Joi.string().optional(),
  tier_order: Joi.number().optional(),
  threshold_text: Joi.string().allow(""),
  min_turnover: Joi.number().optional(),
  commission_percent: Joi.number().optional(),
  payment_cycle: Joi.string().allow(""),
  priority_listing: Joi.boolean().optional(),
  color_code: Joi.string().allow(""),
  badge_color: Joi.string().allow(""),
  features: Joi.array().items(Joi.string()).optional(),
  is_active: Joi.boolean().optional()
});

export {
  createTierSchema,
  updateTierSchema
};