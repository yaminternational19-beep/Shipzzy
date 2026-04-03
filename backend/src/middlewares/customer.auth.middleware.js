import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware for Customer Token Verification
 */
const customerAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized - Customer token missing");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify it's actually a customer session
    if (decoded.role !== "CUSTOMER") {
      throw new ApiError(403, "Forbidden - Only customers can access this endpoint");
    }

    // Attach customer info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    throw new ApiError(401, "Unauthorized - Invalid or expired customer token");
  }
};

export default customerAuthMiddleware;
