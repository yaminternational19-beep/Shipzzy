class ApiError extends Error {
  constructor(statusCode, message, errorCode = "APPLICATION_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export default ApiError;