import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return next(
      new ApiError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        error.details[0].message
      )
    );
  }

  next();
};

export default validate;