import s3Service from '../../services/s3Service.js';
import db from '../../config/db.js';
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';

/* ===============================
   CREATE SUBCATEGORY
================================= */

const createSubCategory = async (data, file) => {

  let imageUrl = null;

  if (file) {
    const upload = await s3Service.uploadFile(file, "subcategories");
    imageUrl = upload.url;
  }

  /* GENERATE SUBCATEGORY CODE */

  const [last] = await db.query(
    `SELECT subcategory_code FROM subcategories ORDER BY id DESC LIMIT 1`
  );

  let newCode = "SUB001";

  if (last.length > 0) {
    const lastNumber = parseInt(last[0].subcategory_code.replace("SUB", ""));
    newCode = `SUB${String(lastNumber + 1).padStart(3, "0")}`;
  }

  /* INSERT */

  const query = `
    INSERT INTO subcategories
    (subcategory_code, category_id, name, description, icon, status)
    VALUES (?,?,?,?,?,?)
  `;

  const values = [
    newCode,
    data.categoryId,
    data.name,
    data.description || "",
    imageUrl,
    data.status || "Active"
  ];

  const [result] = await db.query(query, values);

  return {
    id: result.insertId,
    subCategoryCode: newCode,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    icon: imageUrl,
    status: data.status || "Active"
  };
};


/* ===============================
   GET SUBCATEGORIES
================================= */

const getSubCategories = async (queryParams) => {

  const { page, limit, skip } = getPagination(queryParams);

  let where = [];
  let values = [];

  if (queryParams.status) {
    where.push("sc.status = ?");
    values.push(queryParams.status);
  }

  if (queryParams.search) {
    where.push("sc.name LIKE ?");
    values.push(`%${queryParams.search}%`);
  }

  if (queryParams.categoryId) {
    where.push("sc.category_id = ?");
    values.push(queryParams.categoryId);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  /* TOTAL COUNT */

  const [countResult] = await db.query(
    `SELECT COUNT(*) as total
     FROM subcategories sc
     ${whereClause}`,
    values
  );

  const totalRecords = countResult[0].total;

  /* FETCH DATA */

  const [rows] = await db.query(
    `SELECT
        sc.id,
        sc.subcategory_code,
        sc.name,
        sc.description,
        sc.icon,
        sc.status,
        sc.created_at,
        c.name as category_name,
        c.category_code as category_code,
        sc.category_id
     FROM subcategories sc
     LEFT JOIN categories c ON sc.category_id = c.id
     ${whereClause}
     ORDER BY sc.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, skip]
  );

  const records = rows.map(sub => ({
    id: sub.id,
    subcategory_code: sub.subcategory_code,
    category: sub.category_name,
    category_code: sub.category_code,
    categoryId: sub.category_id,
    name: sub.name,
    description: sub.description,
    icon: sub.icon,
    status: sub.status,
    createdAt: sub.created_at
  }));

  const pagination = getPaginationMeta(page, limit, totalRecords);

  /* ===============================
     STATS
  =============================== */

  const [statsResult] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM categories) as totalCategories,
      COUNT(*) as total,
      SUM(IF(status = 'Active', 1, 0)) as active,
      SUM(IF(status = 'Inactive', 1, 0)) as inactive
    FROM subcategories
  `);

  const stats = {
    totalCategories: statsResult[0].totalCategories || 0,
    totalSubCategories: statsResult[0].total || 0,
    activeSubCategories: statsResult[0].active || 0,
    inactiveSubCategories: statsResult[0].inactive || 0,
  };

  return {
    records,
    pagination,
    stats
  };
};


/* ===============================
   UPDATE SUBCATEGORY
================================= */

const updateSubCategory = async (id, data, file) => {

  const [rows] = await db.query(
    `SELECT * FROM subcategories WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("SubCategory not found");
  }

  const subCategory = rows[0];

  let imageUrl = subCategory.icon;

  if (file) {
    const upload = await s3Service.uploadFile(file, "subcategories");
    imageUrl = upload.url;
  }

  const query = `
    UPDATE subcategories
    SET
      category_id = ?,
      name = ?,
      description = ?,
      icon = ?,
      status = ?
    WHERE id = ?
  `;

  const values = [
    data.categoryId ?? subCategory.category_id,
    data.name ?? subCategory.name,
    data.description ?? subCategory.description,
    imageUrl,
    data.status ?? subCategory.status,
    id
  ];

  await db.query(query, values);

  return {
    id,
    categoryId: data.categoryId ?? subCategory.category_id,
    name: data.name ?? subCategory.name,
    description: data.description ?? subCategory.description,
    icon: imageUrl,
    status: data.status ?? subCategory.status
  };
};


/* ===============================
   TOGGLE STATUS
================================= */

const toggleStatus = async (id, status) => {

  const [rows] = await db.query(
    `SELECT subcategory_code, name, icon, status
     FROM subcategories
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("SubCategory not found");
  }

  await db.query(
    `UPDATE subcategories
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );

  const subCategory = rows[0];

  return {
    id: subCategory.subcategory_code,
    name: subCategory.name,
    icon: subCategory.icon,
    status
  };
};


/* ===============================
   DELETE SUBCATEGORY
================================= */

const deleteSubCategory = async (id) => {

  const [rows] = await db.query(
    `SELECT subcategory_code, name, icon
     FROM subcategories
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("SubCategory not found");
  }

  const subCategory = rows[0];

  if (subCategory.icon) {
    try {
      const key = subCategory.icon.split(".amazonaws.com/")[1];
      await s3Service.deleteFile(key);
    } catch (err) {
      console.log("Image deletion failed:", err.message);
    }
  }

  await db.query(
    `DELETE FROM subcategories WHERE id = ?`,
    [id]
  );

  return {
    id: subCategory.subcategory_code,
    name: subCategory.name,
    icon: subCategory.icon
  };
};


export default {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
  toggleStatus
};