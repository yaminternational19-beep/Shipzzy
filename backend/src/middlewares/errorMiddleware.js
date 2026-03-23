import ApiResponse from '../utils/apiResponse.js';

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  if (err.statusCode) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details
    );
  }

  // Unknown error
  return ApiResponse.error(
    res,
    "Internal Server Error",
    500,
    "SERVER_ERROR"
  );
};

export default errorHandler;