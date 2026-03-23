/**
 * Pagination Utility
 * Used across all list APIs in the delivery app
 */

/**
 * Extract pagination params from request query
 */
export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 10, 1);

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

/**
 * Generate pagination metadata for response
 */
export const getPaginationMeta = (page, limit, totalRecords) => {
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};