import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  // Guard: if body is missing/null (e.g. no Content-Type header),
  // treat it as an empty object so Joi can produce proper 400 errors
  // instead of letting schema.validate(null) throw a 500.
  const body =
    req.body != null && typeof req.body === 'object' ? req.body : {};

  const { error, value } = schema.validate(body, {
    allowUnknown: true,  // don't reject extra fields (e.g. client sends "purpose")
    stripUnknown: true,  // silently remove them before they reach the controller
    abortEarly: true,  // stop on first error for clean messages
  });

  if (error) {
    return next(
      new ApiError(
        400,
        'Validation failed',
        'VALIDATION_ERROR',
        error.details[0].message
      )
    );
  }

  // Replace body with the stripped + validated value
  req.body = value;
  next();
};

export default validate;