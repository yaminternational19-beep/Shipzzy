import db from '../../config/db.js';
import bcrypt from 'bcrypt';
import s3Service from '../../services/s3Service.js';
import { getPagination, getPaginationMeta } from '../../utils/pagination.js';

/* ===============================
   HELPER: GENERATE VENDOR CODE
================================= */

const generateVendorCode = async () => {
    const [last] = await db.query(
        `SELECT vendor_code FROM vendors ORDER BY id DESC LIMIT 1`
    );

    let newCode = "VND0001";

    if (last.length > 0 && last[0].vendor_code) {
        const lastNumber = parseInt(last[0].vendor_code.replace("VND", ""));
        newCode = `VND${String(lastNumber + 1).padStart(4, "0")}`;
    }

    return newCode;
};

/* ===============================
   CREATE VENDOR
================================= */

const createVendor = async (data, files) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Hash Password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 2. Fetch Commission Percent from Tier
        const [tierRows] = await connection.query(
            "SELECT commission_percent FROM tiers WHERE id = ?",
            [data.tier_id]
        );

        if (tierRows.length === 0) {
            throw new Error("Invalid Tier ID");
        }

        const commissionPercent = tierRows[0].commission_percent;

        // 3. Generate Vendor Code
        const vendorCode = await generateVendorCode();

        // 4. Insert Vendor basic data
        const vendorQuery = `
            INSERT INTO vendors (
                vendor_code, business_name, owner_name, email, password,
                country_code, mobile, emergency_country_code, emergency_mobile,
                business_categories, tier_id, commission_percent, address,
                country, country_iso, state, state_iso, city, pincode,
                latitude, longitude, aadhar_number, pan_number,
                license_number, fassi_code, gst_number, bank_name,
                account_name, account_number, ifsc, is_verified, status,
                total_turnover
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const vendorValues = [
            vendorCode, data.business_name, data.owner_name, data.email, hashedPassword,
            data.country_code, data.mobile, data.emergency_country_code || null, data.emergency_mobile || null,
            data.business_categories, data.tier_id, commissionPercent, data.address,
            data.country, data.country_iso, data.state, data.state_iso, data.city, data.pincode,
            data.latitude || null, data.longitude || null, data.aadhar_number, data.pan_number,
            data.license_number || null, data.fassi_code || null, data.gst_number || null, data.bank_name,
            data.account_name, data.account_number, data.ifsc, false, 'Inactive',
            data.total_turnover || 0
        ];

        const [vendorResult] = await connection.query(vendorQuery, vendorValues);
        const vendorId = vendorResult.insertId;

        // 5. Handle File Uploads
        let profilePhotoUrl = null;
        const fileRecords = [];

        if (files) {
            const fileTypes = [
                'profile_photo', 'aadhar_doc', 'pan_doc', 
                'license_doc', 'fassi_doc', 'gst_doc'
            ];

            for (const type of fileTypes) {
                if (files[type] && files[type][0]) {
                    const file = files[type][0];
                    const folder = `vendor/${vendorId}/${type}`;
                    const upload = await s3Service.uploadFile(file, folder);

                    if (type === 'profile_photo') {
                        profilePhotoUrl = upload.url;
                    } else {
                        fileRecords.push([vendorId, type, upload.url]);
                    }
                }
            }
        }

        // 6. Update vendors with profile_photo and Insert vendor_files
        if (profilePhotoUrl) {
            await connection.query(
                "UPDATE vendors SET profile_photo = ? WHERE id = ?",
                [profilePhotoUrl, vendorId]
            );
            fileRecords.push([vendorId, 'profile_photo', profilePhotoUrl]);
        }

        if (fileRecords.length > 0) {
            await connection.query(
                "INSERT INTO vendor_files (vendor_id, file_type, file_url) VALUES ?",
                [fileRecords]
            );
        }

        await connection.commit();
        connection.release();

        return { id: vendorId, vendor_code: vendorCode, email: data.email };

    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

/* ===============================
   GET ALL VENDORS
================================= */

const getAllVendors = async (queryParams) => {
    const { page, limit, skip } = getPagination(queryParams);
    const fetchAll = queryParams.all === 'true'; // skip pagination if ?all=true

    let where = [];
    let values = [];

    if (queryParams.status) {
        where.push("v.status = ?");
        values.push(queryParams.status);
    }

    if (queryParams.kyc_status) {
        where.push("v.kyc_status = ?");
        values.push(queryParams.kyc_status);
    }

    if (queryParams.search) {
        where.push("(v.business_name LIKE ? OR v.owner_name LIKE ? OR v.vendor_code LIKE ? OR v.email LIKE ? OR v.mobile LIKE ?)");
        const searchVal = `%${queryParams.search}%`;
        values.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Total Count for Pagination
    const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM vendors v ${whereClause}`,
        values
    );
    const totalRecords = countResult[0].total;

    // Build query — all fields + tier info
    const selectQuery = `
        SELECT 
            v.id,
            v.vendor_code,
            v.business_name,
            v.owner_name,
            v.email,
            v.country_code,
            v.mobile,
            v.emergency_country_code,
            v.emergency_mobile,
            v.business_categories,
            v.tier_id,
            v.commission_percent,
            v.total_turnover,
            v.address,
            v.country,
            v.country_iso,
            v.state,
            v.state_iso,
            v.city,
            v.pincode,
            v.latitude,
            v.longitude,
            v.aadhar_number,
            v.pan_number,
            v.license_number,
            v.fassi_code,
            v.gst_number,
            v.bank_name,
            v.account_name,
            v.account_number,
            v.ifsc,
            v.profile_photo,
            v.is_verified,
            v.status,
            v.kyc_status,
            v.kyc_reject_reason,
            v.kyc_verified_at,
            v.created_by,
            v.last_login,
            v.created_at,
            v.updated_at,
            t.tier_name,
            t.tier_key,
            t.tier_order,
            t.color_code        AS tier_color,
            t.badge_color       AS tier_badge_color,
            t.payment_cycle     AS tier_payment_cycle,
            t.priority_listing  AS tier_priority_listing
        FROM vendors v
        LEFT JOIN tiers t ON v.tier_id = t.id
        ${whereClause}
        ORDER BY v.created_at DESC
        ${fetchAll ? '' : 'LIMIT ? OFFSET ?'}
    `;

    const queryValues = fetchAll ? values : [...values, limit, skip];
    const [rows] = await db.query(selectQuery, queryValues);

    // Attach all vendor_files as a files[] array on each vendor
    if (rows.length > 0) {
        const vendorIds = rows.map(v => v.id);
        const [allFiles] = await db.query(
            `SELECT id, vendor_id, file_type, file_url, created_at
             FROM vendor_files
             WHERE vendor_id IN (?)`,
            [vendorIds]
        );

        // Group files by vendor_id
        const filesMap = {};
        for (const file of allFiles) {
            if (!filesMap[file.vendor_id]) filesMap[file.vendor_id] = [];
            filesMap[file.vendor_id].push(file);
        }

        rows.forEach(v => { v.files = filesMap[v.id] || []; });
    }

    const pagination = getPaginationMeta(page, limit, totalRecords);

    // Stats
    const [statsResult] = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(IF(status = 'Active', 1, 0)) as active,
            SUM(IF(status = 'Inactive', 1, 0)) as inactive,
            SUM(IF(kyc_status = 'Pending', 1, 0)) as kyc_pending,
            SUM(IF(kyc_status = 'Approved', 1, 0)) as kyc_approved,
            SUM(IF(kyc_status = 'Rejected', 1, 0)) as kyc_rejected
        FROM vendors
    `);

    const stats = {
        totalVendors: statsResult[0].total || 0,
        activeVendors: statsResult[0].active || 0,
        inactiveVendors: statsResult[0].inactive || 0,
        kycStats: {
            pending: statsResult[0].kyc_pending || 0,
            approved: statsResult[0].kyc_approved || 0,
            rejected: statsResult[0].kyc_rejected || 0
        }
    };

    return {
        records: rows,
        pagination: fetchAll ? null : pagination,
        stats
    };
};


/* ===============================
   GET VENDOR BY ID
================================= */

const getVendorById = async (id) => {
    const [vendorRows] = await db.query(`
        SELECT 
            v.*, t.tier_name 
        FROM vendors v 
        LEFT JOIN tiers t ON v.tier_id = t.id 
        WHERE v.id = ?
    `, [id]);

    if (vendorRows.length === 0) {
        throw new Error("Vendor not found");
    }

    const [fileRows] = await db.query(
        "SELECT id, file_type, file_url FROM vendor_files WHERE vendor_id = ?",
        [id]
    );

    const vendor = vendorRows[0];
    vendor.files = fileRows;

    return vendor;
};

/* ===============================
   UPDATE VENDOR
================================= */

const updateVendor = async (id, data, files) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [existingVendorRows] = await connection.query(
            "SELECT profile_photo FROM vendors WHERE id = ?",
            [id]
        );

        if (existingVendorRows.length === 0) {
            throw new Error("Vendor not found");
        }

        const existingVendor = existingVendorRows[0];

        // 1. Prepare fields to update
        let updateFields = [];
        let updateValues = [];

        const fields = [
            'business_name', 'owner_name', 'email', 'mobile',
            'country_code', 'emergency_country_code', 'emergency_mobile',
            'business_categories', 'tier_id', 'address', 'country',
            'country_iso', 'state', 'state_iso', 'city', 'pincode',
            'latitude', 'longitude', 'aadhar_number', 'pan_number',
            'license_number', 'fassi_code', 'gst_number', 'bank_name',
            'account_name', 'account_number', 'ifsc', 'total_turnover'
        ];

        for (const field of fields) {
            if (data[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(data[field]);
            }
        }

        // 2. Handle tier_id change -> update commission_percent
        if (data.tier_id) {
            const [tierRows] = await connection.query(
                "SELECT commission_percent FROM tiers WHERE id = ?",
                [data.tier_id]
            );
            if (tierRows.length > 0) {
                updateFields.push("commission_percent = ?");
                updateValues.push(tierRows[0].commission_percent);
            }
        }

        // 3. Handle password update
        if (data.password && data.password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            updateFields.push("password = ?");
            updateValues.push(hashedPassword);
        }

        // 4. Handle File Updates
        if (files) {
            const fileTypes = [
                'profile_photo', 'aadhar_doc', 'pan_doc', 
                'license_doc', 'fassi_doc', 'gst_doc'
            ];

            for (const type of fileTypes) {
                if (files[type] && files[type][0]) {
                    const file = files[type][0];
                    const folder = `vendor/${id}/${type}`;

                    // Update File (Profile Photo or Documents)
                    const [existingFileRows] = await connection.query(
                        "SELECT file_url FROM vendor_files WHERE vendor_id = ? AND file_type = ?",
                        [id, type]
                    );

                    // If profile photo, also update vendors table
                    if (type === 'profile_photo') {
                        const upload = await s3Service.uploadFile(file, folder);
                        
                        // Delete old profile photo from S3 if exists
                        if (existingVendor.profile_photo) {
                            try {
                                const oldKey = existingVendor.profile_photo.split(".amazonaws.com/")[1];
                                if (oldKey) await s3Service.deleteFile(oldKey);
                            } catch (e) { console.error("Old profile deletion failed", e); }
                        }

                        // Update Vendors table
                        updateFields.push("profile_photo = ?");
                        updateValues.push(upload.url);

                        // Update or Insert in vendor_files table
                        if (existingFileRows.length > 0) {
                            await connection.query(
                                "UPDATE vendor_files SET file_url = ? WHERE vendor_id = ? AND file_type = ?",
                                [upload.url, id, 'profile_photo']
                            );
                        } else {
                            await connection.query(
                                "INSERT INTO vendor_files (vendor_id, file_type, file_url) VALUES (?, ?, ?)",
                                [id, 'profile_photo', upload.url]
                            );
                        }
                    } else {
                        // Standard Document Update
                        if (existingFileRows.length > 0) {
                            try {
                                const oldKey = existingFileRows[0].file_url.split(".amazonaws.com/")[1];
                                if (oldKey) await s3Service.deleteFile(oldKey);
                            } catch (e) { console.error("Old document deletion failed", e); }

                            const upload = await s3Service.uploadFile(file, folder);
                            await connection.query(
                                "UPDATE vendor_files SET file_url = ? WHERE vendor_id = ? AND file_type = ?",
                                [upload.url, id, type]
                            );
                        } else {
                            const upload = await s3Service.uploadFile(file, folder);
                            await connection.query(
                                "INSERT INTO vendor_files (vendor_id, file_type, file_url) VALUES (?, ?, ?)",
                                [id, type, upload.url]
                            );
                        }
                    }
                }
            }
        }

        // 5. Update Vendors table
        if (updateFields.length > 0) {
            updateValues.push(id);
            await connection.query(
                `UPDATE vendors SET ${updateFields.join(", ")} WHERE id = ?`,
                updateValues
            );
        }

        await connection.commit();
        connection.release();
        return { id, message: "Vendor updated successfully" };

    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

/* ===============================
   UPDATE STATUS
================================= */

const updateStatus = async (id, status) => {
    const [result] = await db.query(
        "UPDATE vendors SET status = ? WHERE id = ?",
        [status, id]
    );

    if (result.affectedRows === 0) {
        throw new Error("Vendor not found");
    }

    return { id, status };
};

/* ===============================
   UPDATE KYC STATUS
================================= */

const updateKycStatus = async (id, data, userId) => {
    const query = `
        UPDATE vendors 
        SET 
            kyc_status = ?, 
            kyc_reject_reason = ?, 
            kyc_verified_by = ?, 
            kyc_verified_at = NOW() 
        WHERE id = ?
    `;
    const values = [
        data.kyc_status,
        data.kyc_status === 'Rejected' ? data.kyc_reject_reason : null,
        userId,
        id
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("Vendor not found");
    }

    return { id, kyc_status: data.kyc_status };
};

export default {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    updateStatus,
    updateKycStatus
};