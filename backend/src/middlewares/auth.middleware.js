import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized - Token missing");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      vendor_id: decoded.vendor_id
    };

    next();
  } catch (err) {
    throw new ApiError(401, "Unauthorized - Invalid or expired token");
  }
};

export default authMiddleware;