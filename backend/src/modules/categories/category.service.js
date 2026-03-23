// import Category from '../../models/category.model.js';
import s3Service from '../../services/s3Service.js';
import db from '../../config/db.js';
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';




const createCategory = async (data, file) => {

  let imageUrl = null;

  /* ===============================
     UPLOAD IMAGE
  =============================== */

  if (file) {
    const upload = await s3Service.uploadFile(file, "categories");
    imageUrl = upload.url;
  }

  /* ===============================
     GENERATE CATEGORY CODE
  =============================== */

  const [last] = await db.query(
    `SELECT category_code FROM categories ORDER BY id DESC LIMIT 1`
  );

  let newCode = "CAT001";

  if (last.length > 0) {
    const lastNumber = parseInt(last[0].category_code.replace("CAT", ""));
    newCode = `CAT${String(lastNumber + 1).padStart(3, "0")}`;
  }

  /* ===============================
     INSERT CATEGORY
  =============================== */

  const query = `
    INSERT INTO categories
    (category_code,name,description,icon,status)
    VALUES (?,?,?,?,?)
  `;

  const values = [
    newCode,
    data.name,
    data.description || "",
    imageUrl,
    data.status || "Active"
  ];

  const [result] = await db.query(query, values);

  return {
    id: result.insertId,
    categoryCode: newCode,
    name: data.name,
    description: data.description,
    icon: imageUrl,
    status: data.status || "Active"
  };
};

const getCategories = async (queryParams) => {

  const { page, limit, skip } = getPagination(queryParams);

  let where = [];
  let values = [];

  /* ===============================
     FILTERS
  =============================== */

  if (queryParams.status) {
    where.push("c.status = ?");
    values.push(queryParams.status);
  }

  if (queryParams.search) {
    where.push("c.name LIKE ?");
    values.push(`%${queryParams.search}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  /* ===============================
     TOTAL COUNT (FILTERED)
  =============================== */

  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM categories c ${whereClause}`,
    values
  );

  const totalRecords = countResult[0].total;

  /* ===============================
     FETCH DATA WITH SUBCATEGORY COUNT
  =============================== */

  const [rows] = await db.query(
    `SELECT 
        c.id,
        c.category_code,
        c.name,
        c.description,
        c.icon,
        c.status,
        c.created_at,
        COUNT(sc.id) AS subCategoryCount
     FROM categories c
     LEFT JOIN subcategories sc 
        ON sc.category_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, skip]
  );

  /* ===============================
     FORMAT RESPONSE
  =============================== */

  const records = rows.map(cat => ({
    id: cat.id,
    category_code: cat.category_code,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    status: cat.status,
    subCategoryCount: cat.subCategoryCount,
    createdAt: cat.created_at
  }));

  const pagination = getPaginationMeta(page, limit, totalRecords);

  /* ===============================
     GLOBAL STATS
  =============================== */

  const [categoryStats] = await db.query(`
  SELECT 
    COUNT(*) as total,
    SUM(status = 'Active') as active,
    SUM(status = 'Inactive') as inactive
  FROM categories
`);

const [subCategoryStats] = await db.query(`
  SELECT COUNT(*) as totalSubCategories
  FROM subcategories
`);

const statsData = {
  total: categoryStats[0].total,
  active: categoryStats[0].active,
  inactive: categoryStats[0].inactive,
  totalSubCategories: subCategoryStats[0].totalSubCategories
};

  return {
    stats: statsData,
    records,
    pagination
  };
};


const updateCategory = async (id, data, file) => {

  /* ===============================
     CHECK CATEGORY
  =============================== */

  const [rows] = await db.query(
    `SELECT * FROM categories WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Category not found");
  }

  const category = rows[0];

  let imageUrl = category.icon;

  /* ===============================
     UPLOAD NEW IMAGE
  =============================== */

  if (file) {
    const upload = await s3Service.uploadFile(file, "categories");
    imageUrl = upload.url;
  }

  /* ===============================
     UPDATE QUERY
  =============================== */

  const query = `
    UPDATE categories
    SET 
      name = ?,
      description = ?,
      icon = ?,
      status = ?
    WHERE id = ?
  `;

  const values = [
    data.name ?? category.name,
    data.description ?? category.description,
    imageUrl,
    data.status ?? category.status,
    id
  ];

  await db.query(query, values);

  return {
    id: category.id,
    category_code: category.category_code,
    name: data.name ?? category.name,
    description: data.description ?? category.description,
    icon: imageUrl,
    status: data.status ?? category.status
  };
};

const toggleStatus = async (id, status) => {

  /* ===============================
     CHECK CATEGORY
  =============================== */

  const [rows] = await db.query(
    `SELECT id, category_code, name, description, icon, status
     FROM categories
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Category not found");
  }

  /* ===============================
     UPDATE STATUS
  =============================== */

  await db.query(
    `UPDATE categories
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );

  const category = rows[0];

  return {
    id: category.id,
    category_code: category.category_code,
    name: category.name,
    description: category.description,
    icon: category.icon,
    status
  };
};


const deleteCategory = async (id) => {

  /* ===============================
     CHECK CATEGORY
  =============================== */

  const [rows] = await db.query(
    `SELECT id, category_code, name, icon 
     FROM categories 
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Category not found");
  }

  const category = rows[0];

  /* ===============================
     DELETE IMAGE FROM S3
  =============================== */

  if (category.icon) {
    try {
      const key = category.icon.split(".amazonaws.com/")[1];
      await s3Service.deleteFile(key);
    } catch (err) {
      console.log("Old image deletion failed:", err.message);
    }
  }

  /* ===============================
     DELETE CATEGORY
  =============================== */

  await db.query(
    `DELETE FROM categories WHERE id = ?`,
    [id]
  );

  return {
    id: category.id,
    category_code: category.category_code,
    name: category.name,
    icon: category.icon
  };
};



export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleStatus
};