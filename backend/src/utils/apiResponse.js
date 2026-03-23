class ApiResponse {
  static success(res, message = "Success", data = null, status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
      error: null
    });
  }

  static error(
    res,
    message = "Something went wrong",
    status = 500,
    errorCode = "SERVER_ERROR",
    details = null
  ) {
    return res.status(status).json({
      success: false,
      message,
      data: null,
      error: {
        code: errorCode,
        details
      }
    });
  }
}

export default ApiResponse;