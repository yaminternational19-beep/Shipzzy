
import db from '../../config/db.js';
import s3Service from '../../services/s3Service.js';
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';

const createBrand = async (data, file) => {

  let logoUrl = null;

  if (file) {
    const upload = await s3Service.uploadFile(file, "brands");
    logoUrl = upload.url;
  }

  /* GENERATE BRAND CODE */

  const [last] = await db.query(
    `SELECT brand_code FROM brands ORDER BY id DESC LIMIT 1`
  );

  let newCode = "BR001";

  if (last.length > 0) {
    const lastNumber = parseInt(last[0].brand_code.replace("BR", ""));
    newCode = `BR${String(lastNumber + 1).padStart(3, "0")}`;
  }

  const query = `
    INSERT INTO brands
    (brand_code,name,category_id,subcategory_id,logo,description,status)
    VALUES (?,?,?,?,?,?,?)
  `;

  const values = [
    newCode,
    data.name,
    data.categoryId,
    data.subCategoryId,
    logoUrl,
    data.description || "",
    data.status || "Active"
  ];

  const [result] = await db.query(query, values);

  return {
    id: result.insertId,
    brand_code: newCode,
    name: data.name,
    categoryId: data.categoryId,
    subCategoryId: data.subCategoryId,
    logo: logoUrl,
    description: data.description,
    status: data.status || "Active"
  };
};

const getBrands = async (queryParams) => {

  const { page, limit, skip } = getPagination(queryParams);

  let where = [];
  let values = [];

  if (queryParams.status) {
    where.push("b.status = ?");
    values.push(queryParams.status);
  }

  if (queryParams.search) {
    where.push("b.name LIKE ?");
    values.push(`%${queryParams.search}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  /* ===============================
     TOTAL COUNT
  =============================== */

  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM brands b ${whereClause}`,
    values
  );

  const totalRecords = countResult[0].total;

  /* ===============================
     FETCH BRANDS
  =============================== */

  const [rows] = await db.query(
    `SELECT 
      b.id,
      b.brand_code,
      b.name,
      b.logo,
      b.description,
      b.status,
      b.created_at,
      c.name as category,
      sc.name as subcategory
     FROM brands b
     LEFT JOIN categories c ON b.category_id = c.id
     LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, skip]
  );

  const records = rows.map(b => ({
    id: b.id,
    brand_code: b.brand_code,
    name: b.name,
    category: b.category,
    subCategory: b.subcategory,
    logo: b.logo,
    description: b.description,
    status: b.status,
    createdAt: b.created_at
  }));

  const pagination = getPaginationMeta(page, limit, totalRecords);

  /* ===============================
     STATS
  =============================== */

  const [stats] = await db.query(`
    SELECT
      COUNT(*) as totalBrands,
      SUM(status = 'Active') as activeBrands,
      SUM(status = 'Inactive') as inactiveBrands
    FROM brands
  `);

  const statsData = {
    totalBrands: stats[0].totalBrands,
    activeBrands: stats[0].activeBrands,
    inactiveBrands: stats[0].inactiveBrands,
    totalProducts: 0
  };

  return {
    stats: statsData,
    records,
    pagination
  };
};

const updateBrand = async (id, data, file) => {

  const [rows] = await db.query(
    `SELECT * FROM brands WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error("Brand not found");
  }

  const brand = rows[0];

  let logoUrl = brand.logo;

  if (file) {
    const upload = await s3Service.uploadFile(file, "brands");
    logoUrl = upload.url;
  }

  const query = `
    UPDATE brands
    SET
      name = ?,
      category_id = ?,
      subcategory_id = ?,
      logo = ?,
      description = ?,
      status = ?
    WHERE id = ?
  `;

  const values = [
    data.name ?? brand.name,
    data.categoryId ?? brand.category_id,
    data.subCategoryId ?? brand.subcategory_id,
    logoUrl,
    data.description ?? brand.description,
    data.status ?? brand.status,
    id
  ];

  await db.query(query, values);

  return { id };
};

const toggleStatus = async (id, status) => {

  const [rows] = await db.query(
    `SELECT id FROM brands WHERE id = ?`,
    [id]
  );

  if (!rows.length) {
    throw new Error("Brand not found");
  }

  await db.query(
    `UPDATE brands SET status = ? WHERE id = ?`,
    [status, id]
  );

  return { id, status };
};

const deleteBrand = async (id) => {

  const [rows] = await db.query(
    `SELECT id, logo FROM brands WHERE id = ?`,
    [id]
  );

  if (!rows.length) {
    throw new Error("Brand not found");
  }

  const brand = rows[0];

  if (brand.logo) {
    try {
      const key = brand.logo.split(".amazonaws.com/")[1];
      await s3Service.deleteFile(key);
    } catch (err) {
      console.log("Logo delete failed:", err.message);
    }
  }

  await db.query(
    `DELETE FROM brands WHERE id = ?`,
    [id]
  );

  return { id };
};

export default {
    createBrand,
    getBrands,
    updateBrand,
    toggleStatus,
    deleteBrand
};  