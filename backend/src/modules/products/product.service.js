import db from "../../config/db.js";
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';
import slugify from 'slugify';
import s3Service from '../../services/s3Service.js';
import { createProductSchema } from './product.validator.js';
import ApiError from '../../utils/ApiError.js';

const createProduct = async (data, files) => {
  // Handle JSON strings if from multipart
  if (typeof data.variants === 'string') data.variants = JSON.parse(data.variants);
  if (typeof data.specification === 'string') data.specification = JSON.parse(data.specification);
  if (typeof data.images === 'string') data.images = JSON.parse(data.images);

  // Clean up empty strings, 'null' strings, or non-numeric names for numeric ID fields
  const idFields = ['category_id', 'subcategory_id', 'brand_id', 'vendor_id'];
  idFields.forEach(field => {
    const rawVal = data[field];
    const val = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

    // If value is missing, empty, or the text "null"/"undefined", strictly set to null
    if (val === '' || val === 'null' || val === 'undefined' || val === undefined || val === null) {
      data[field] = null;
    } else if (isNaN(Number(val))) {
      // If it's a string that can't be a number (like a category name from Excel), set to null
      data[field] = null;
    } else {
      // Otherwise, safely cast to a real Number
      data[field] = Number(val);
    }
  });

  // Validate request and get transformed (type-casted) values
  const { error, value: validatedData } = createProductSchema.validate(data);
  if (error) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", error.details[0].message);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      vendor_id, category_id, subcategory_id, brand_id, custom_brand,
      name, description, specification, country_of_origin,
      manufacture_date, expiry_date, return_allowed, return_days,
      variants, images
    } = validatedData;

    // Fetch Vendor/Category info for S3 path and approval policy
    const [metaRows] = await connection.query(
      `SELECT v.business_name, v.auto_approve_products, c.name as category_name
       FROM vendors v, categories c 
       WHERE v.id = ? AND c.id = ?`,
      [vendor_id, category_id]
    );

    if (metaRows.length === 0) throw new Error("Vendor or Category not found");

    const vendorInfo = metaRows[0];

    // 1. UNIQUE CHECK (Pre-insert)
    const [existing] = await connection.query(
      `SELECT p.id 
       FROM products p
       JOIN product_variants v ON v.product_id = p.id
       WHERE p.vendor_id = ?
       AND p.name = ?
       AND v.variant_name = ?
       LIMIT 1`,
      [vendor_id, name, variants[0].variant_name]
    );

    if (existing.length > 0) {
      throw new ApiError(400, "Product already exists", "DUPLICATE_ERROR");
    }

    const vendorSlug = slugify(vendorInfo.business_name, { lower: true });
    const categorySlug = slugify(vendorInfo.category_name, { lower: true });
    const productPathName = slugify(name, { lower: true });
    const s3Folder = `${vendorSlug}/${categorySlug}/${productPathName}`;

    // Handle S3 Uploads
    const uploadedImages = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const upload = await s3Service.uploadFile(files[i], s3Folder);
        uploadedImages.push({
          image_url: upload.url,
          is_primary: i === 0,
          sort_order: i
        });
      }
    }

    const finalImages = [...(images || []), ...uploadedImages];

    const m_date = manufacture_date ? new Date(manufacture_date).toISOString().split('T')[0] : null;
    const e_date = expiry_date ? new Date(expiry_date).toISOString().split('T')[0] : null;

    // Slug Unique Guard
    let productBaseSlug = slugify(name, { lower: true });
    let productSlug = productBaseSlug;
    let isUnique = false;
    let counter = 0;
    while (!isUnique) {
      const [duplicate] = await connection.query(`SELECT id FROM products WHERE slug = ?`, [productSlug]);
      if (duplicate.length === 0) {
        isUnique = true;
      } else {
        counter++;
        productSlug = `${productBaseSlug}-${counter}`;
      }
    }

    const autoApprove = vendorInfo.auto_approve_products === 1;
    const approvalStatus = autoApprove ? 'APPROVED' : 'PENDING';

    // Insert into products table
    const [productResult] = await connection.query(
      `INSERT INTO products 
      (vendor_id, category_id, subcategory_id, brand_id, custom_brand, name, slug, description, specification,
       country_of_origin, manufacture_date, expiry_date, return_allowed, return_days, approval_status, is_live, is_active, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id,
        category_id,
        subcategory_id,
        brand_id,
        custom_brand,
        name,
        productSlug,
        description,
        JSON.stringify(specification),
        country_of_origin, m_date, e_date,
        return_allowed ? 1 : 0, return_days,
        approvalStatus,
        autoApprove ? 1 : 0,
        autoApprove ? 1 : 0,
        autoApprove ? new Date() : null
      ]
    );

    const productId = productResult.insertId;

    // Bulk Insert Variants
    const variantValues = variants.map((v, i) => [
      productId, v.variant_name, v.unit, v.color,
      v.sku || `PROD-${productId}-${i + 1}-${Date.now()}`,
      v.mrp, v.sale_price, v.discount_value, v.discount_type, v.stock, v.min_order, v.low_stock_alert
    ]);

    if (variantValues.length > 0) {
      await connection.query(
        `INSERT INTO product_variants 
        (product_id, variant_name, unit, color, sku, mrp, sale_price, discount_value, discount_type, stock, min_order, low_stock_alert) 
        VALUES ?`,
        [variantValues]
      );
    }

    // Bulk Insert Images
    if (finalImages.length > 0) {
      const imageValues = finalImages.map((img, i) => [
        productId, img.image_url, img.is_primary ? 1 : 0, i
      ]);
      await connection.query(
        `INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();
    return { product_id: productId };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const getAllProducts = async (queryParams) => {
  const { page, limit, skip } = getPagination(queryParams);

  let where = [];
  let values = [];

  // Filters
  if (queryParams.vendor_id) {
    where.push("p.vendor_id = ?");
    values.push(queryParams.vendor_id);
  }
  if (queryParams.category_id) {
    where.push("p.category_id = ?");
    values.push(queryParams.category_id);
  }
  if (queryParams.approval_status) {
    where.push("p.approval_status = ?");
    values.push(queryParams.approval_status);
  }
  if (queryParams.is_live !== undefined) {
    where.push("p.is_live = ?");
    values.push(queryParams.is_live === 'true' ? 1 : 0);
  }
  if (queryParams.search) {
    where.push("(p.name LIKE ? OR p.custom_brand LIKE ?)");
    const searchVal = `%${queryParams.search}%`;
    values.push(searchVal, searchVal);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Total Count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM products p ${whereClause}`,
    values
  );
  const totalRecords = countResult[0].total;

  // Fetch Products
  const selectQuery = `
    SELECT 
      p.id, p.vendor_id, p.category_id, p.subcategory_id, p.brand_id, p.custom_brand, 
      p.name, p.slug, p.description, p.specification, p.country_of_origin,
      DATE_FORMAT(p.manufacture_date, '%Y-%m-%d') as manufacture_date,
      DATE_FORMAT(p.expiry_date, '%Y-%m-%d') as expiry_date,
      p.return_allowed, p.return_days, p.approval_status, p.rejection_reason, p.rejected_at, p.approved_by, p.approved_at,
      p.is_live, p.is_active, p.view_count, p.sold_count,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') as created_at,
      DATE_FORMAT(p.updated_at, '%Y-%m-%d') as updated_at,
      DATe_FORMAT(p.rejected_at, '%Y-%m-%d') as rejected_at,
      v.business_name as vendor_name,
      c.name as category_name,
      sc.name as subcategory_name,
      COALESCE(b.name, p.custom_brand) as brand_name
    FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN brands b ON p.brand_id = b.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(selectQuery, [...values, limit, skip]);

  if (rows.length > 0) {
    const productIds = rows.map(p => p.id);

    // Fetch ALL images for these products
    const [images] = await db.query(
      `SELECT product_id, image_url, is_primary FROM product_images WHERE product_id IN (?) ORDER BY sort_order ASC`,
      [productIds]
    );
    const imagesMap = {};
    images.forEach(img => {
      if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
      imagesMap[img.product_id].push(img.image_url);
    });

    // Fetch prices and inventory summary
    const [variants] = await db.query(
      `SELECT 
        product_id, 
        MAX(id) as variant_id,
        SUM(stock) as total_stock, 
        MIN(sale_price) as min_price, 
        MIN(mrp) as min_mrp,
        MAX(discount_value) as max_discount,
        MAX(discount_type) as discount_type,
        MAX(low_stock_alert) as low_stock_alert,
        MAX(unit) as unit,
        MAX(color) as color,
        MAX(sku) as sku,
        MAX(variant_name) as variant_name
       FROM product_variants 
       WHERE product_id IN (?) 
       GROUP BY product_id`,
      [productIds]
    );

    const variantMap = {};
    variants.forEach(v => {
      variantMap[v.product_id] = {
        variant_id: v.variant_id,
        total_stock: v.total_stock,
        min_price: v.min_price,
        min_mrp: v.min_mrp,
        max_discount: v.max_discount,
        discount_type: v.discount_type,
        low_stock_alert: v.low_stock_alert,
        unit: v.unit,
        color: v.color,
        sku: v.sku,
        variant_name: v.variant_name
      };
    });

    rows.forEach(p => {
      p.all_images = imagesMap[p.id] || [];
      p.primary_image = (imagesMap[p.id] && imagesMap[p.id][0]) || null;
      p.inventory_info = variantMap[p.id] || {
        total_stock: 0, min_price: 0, min_mrp: 0, max_discount: 0,
        discount_type: 'Percent', low_stock_alert: 5,
        unit: 'PCS', color: 'N/A', sku: '', variant_name: 'Single'
      };
    });
  }

  // Simplified: Returning only the data records as requested
  return rows;
};

const updateProduct = async (productId, data, files) => {
  // Handle JSON strings if from multipart
  if (typeof data.variants === 'string') data.variants = JSON.parse(data.variants);
  if (typeof data.specification === 'string') data.specification = JSON.parse(data.specification);
  if (typeof data.images === 'string') data.images = JSON.parse(data.images);

  // Clean up empty strings, 'null' strings, or non-numeric names for numeric ID fields
  const idFields = ['category_id', 'subcategory_id', 'brand_id', 'vendor_id'];
  idFields.forEach(field => {
    const rawVal = data[field];
    const val = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

    // If value is missing, empty, or the text "null"/"undefined", strictly set to null
    if (val === '' || val === 'null' || val === 'undefined' || val === undefined || val === null) {
      data[field] = null;
    } else if (isNaN(Number(val))) {
      // If it's a string that can't be a number (like a category name from Excel), set to null
      data[field] = null;
    } else {
      // Otherwise, safely cast to a real Number
      data[field] = Number(val);
    }
  });

  const { error, value: validatedData } = createProductSchema.validate(data);
  if (error) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", error.details[0].message);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      vendor_id, category_id, subcategory_id, brand_id, custom_brand,
      name, description, specification, country_of_origin,
      manufacture_date, expiry_date, return_allowed, return_days,
      variants, images
    } = validatedData;

    // Fetch existing product and Vendor/Category for pathing
    const [existingRows] = await connection.query(`SELECT * FROM products WHERE id = ?`, [productId]);
    if (existingRows.length === 0) throw new ApiError(404, "Product not found");

    const [metaRows] = await connection.query(
      `SELECT v.business_name, v.auto_approve_products, c.name as category_name 
       FROM vendors v, categories c 
       WHERE v.id = ? AND c.id = ?`,
      [vendor_id, category_id]
    );
    if (metaRows.length === 0) throw new Error("Vendor or Category not found");

    const vendorInfo = metaRows[0];
    const autoApprove = vendorInfo.auto_approve_products === 1;
    const approvalStatus = autoApprove ? 'APPROVED' : 'PENDING';
    const isLive = autoApprove ? 1 : 0;

    const vendorSlug = slugify(vendorInfo.business_name, { lower: true });
    const categorySlug = slugify(vendorInfo.category_name, { lower: true });
    const productPathName = slugify(name, { lower: true });
    const s3Folder = `${vendorSlug}/${categorySlug}/${productPathName}`;

    // Handle Image Updates
    const newlyUploadedImages = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const upload = await s3Service.uploadFile(files[i], s3Folder);
        newlyUploadedImages.push({
          image_url: upload.url,
          is_primary: i === 0 && (!images || images.length === 0),
          sort_order: (images ? images.length : 0) + i
        });
      }
    }

    const finalImages = [...(images || []), ...newlyUploadedImages];

    // Update main product details
    const productSlug = slugify(name, { lower: true }) + '-' + productId;

    await connection.query(
      `UPDATE products SET 
        vendor_id=?, category_id=?, subcategory_id=?, brand_id=?, custom_brand=?, name=?, slug=?, 
        description=?, specification=?, country_of_origin=?, manufacture_date=?, expiry_date=?, 
        return_allowed=?, return_days=?, approval_status=?, is_live=?, is_active=?, approved_at=?
       WHERE id = ?`,
      [
        vendor_id, category_id, subcategory_id, brand_id, custom_brand, name, productSlug,
        description, JSON.stringify(specification), country_of_origin, manufacture_date, expiry_date,
        return_allowed ? 1 : 0, return_days, approvalStatus, isLive, 
        autoApprove ? 1 : 0, 
        autoApprove ? new Date() : null,
        productId
      ]
    );

    // Update Variants: Simple replace (Delete then Re-insert)
    await connection.query(`DELETE FROM product_variants WHERE product_id = ?`, [productId]);
    let variantIndex = 1;
    for (const variant of variants) {
      if (!variant.sku || variant.sku.trim() === '') {
        variant.sku = `PROD-${productId}-${variantIndex}-${Date.now()}`;
      }
      variantIndex++;

      await connection.query(
        `INSERT INTO product_variants
        (product_id, variant_name, unit, color, sku, mrp, sale_price, discount_value, discount_type, stock, min_order, low_stock_alert)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId, variant.variant_name, variant.unit, variant.color, variant.sku,
          variant.mrp, variant.sale_price, variant.discount_value, variant.discount_type,
          variant.stock, variant.min_order, variant.low_stock_alert
        ]
      );
    }

    // Image Clean-up (S3 Deletion for removed images) and Bulk Re-insert
    const [oldImages] = await connection.query(`SELECT image_url FROM product_images WHERE product_id = ?`, [productId]);
    const incomingUrls = finalImages.map(img => img.image_url);
    const removedImages = oldImages.filter(img => !incomingUrls.includes(img.image_url));

    for (const img of removedImages) {
      const key = img.image_url.split('.amazonaws.com/')[1];
      if (key) await s3Service.deleteFile(key);
    }

    await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);
    const imageValues = finalImages.map((img, i) => [productId, img.image_url, img.is_primary ? 1 : 0, i]);
    if (imageValues.length > 0) {
      await connection.query(`INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ?`, [imageValues]);
    }

    await connection.commit();
    return { product_id: productId };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const toggleProductLiveStatus = async (productId, isLive) => {
  const [productRows] = await db.query(
    `SELECT approval_status FROM products WHERE id = ?`,
    [productId]
  );

  if (productRows.length === 0) {
    throw new ApiError(404, "Product not found");
  }

  const { approval_status } = productRows[0];

  if (approval_status !== 'APPROVED') {
    throw new ApiError(400, "Only fully APPROVED products can be made LIVE. This product is currently " + approval_status, "STATUS_RESTRICTION");
  }

  // Update live status
  await db.query(
    `UPDATE products SET is_live = ? WHERE id = ?`,
    [isLive ? 1 : 0, productId]
  );

  return { product_id: productId, is_live: isLive ? 1 : 0 };
};

const updateStock = async (vendorId, payload) => {
  const { product_id, variant_id, change_type, quantity, note } = payload;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get Stock and Actual Vendor ID (Super Admin bypass vs Vendor lock)
    let query = `SELECT v.stock, p.vendor_id FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ? AND v.product_id = ?`;
    const params = [variant_id, product_id];

    if (vendorId) {
      query += ` AND p.vendor_id = ?`;
      params.push(vendorId);
    }
    query += ` FOR UPDATE`;

    const [existing] = await connection.query(query, params);

    if (existing.length === 0) {
      throw new ApiError(404, "Product variant not found or unauthorized access");
    }

    const previous_stock = existing[0].stock;
    const actualVendorId = existing[0].vendor_id;
    let new_stock = previous_stock;

    // 2. Calculate New Stock
    if (change_type === 'ADD' || change_type === 'RETURN') {
      new_stock = previous_stock + quantity;
    } else if (change_type === 'REMOVE' || change_type === 'ORDER') {
      new_stock = previous_stock - quantity;
    }

    // 3. Prevent Negative Stock
    if (new_stock < 0) {
      throw new ApiError(400, "Insufficient stock. Current stock: " + previous_stock);
    }

    // 4. Update Product Variant
    await connection.query(
      `UPDATE product_variants SET stock = ? WHERE id = ?`,
      [new_stock, variant_id]
    );

    // 5. Insert Stock Log
    await connection.query(
      `INSERT INTO product_stock_logs 
       (product_id, variant_id, vendor_id, change_type, quantity, previous_stock, new_stock, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, variant_id, actualVendorId, change_type, quantity, previous_stock, new_stock, note || '']
    );


    await connection.commit();
    return { previous_stock, change: (new_stock - previous_stock), new_stock };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const deleteProduct = async (productId, vendorId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify Product ownership and Fetch Images for S3 cleanup
    let query = `SELECT image_url FROM product_images WHERE product_id = ?`;
    let params = [productId];

    // If VendorId exists, confirm ownership first
    if (vendorId) {
      const [own] = await connection.query(`SELECT id FROM products WHERE id = ? AND vendor_id = ?`, [productId, vendorId]);
      if (own.length === 0) throw new ApiError(403, "Access denied - unauthorized item deletion");
    }

    const [images] = await connection.query(query, params);

    // 2. Cleanup S3 Assets
    for (const img of images) {
      const key = img.image_url.split('.amazonaws.com/')[1];
      if (key) await s3Service.deleteFile(key);
    }

    // 3. Delete from DB (Triggers CASCADE for variants and images)
    await connection.query(`DELETE FROM products WHERE id = ?`, [productId]);

    await connection.commit();
    return { success: true, deleted_id: productId };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  createProduct,
  updateProduct,
  getAllProducts,
  toggleProductLiveStatus,
  updateStock,
  deleteProduct
};
