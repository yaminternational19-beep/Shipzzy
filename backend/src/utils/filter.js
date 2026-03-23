/**
 * Global Filter Utility
 * Handles search + query filters
 */

const buildFilters = (queryParams, searchableFields = []) => {

  const { search } = queryParams;

  const filters = {};

  /* -----------------------------
     SEARCH FILTER
  -----------------------------*/
  if (search && searchableFields.length) {
    filters.$or = searchableFields.map((field) => ({
      [field]: { $regex: search, $options: "i" }
    }));
  }

  /* -----------------------------
     FIELD FILTERS
     Example:
     ?role=Admin
     ?status=Active
  -----------------------------*/

  const excluded = ["page", "limit", "search"];

  Object.keys(queryParams).forEach((key) => {
    if (!excluded.includes(key)) {
      filters[key] = queryParams[key];
    }
  });

  return filters;
};

export default buildFilters;