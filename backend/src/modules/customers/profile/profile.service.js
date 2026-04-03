import db from "../../../config/db.js";
import ApiError from "../../../utils/ApiError.js";
import s3Service from "../../../services/s3Service.js";

const getCustomerById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        id,
        country_code,
        mobile,
        full_phone,
        name,
        email,
        gender,
        profile_image,
        referral_code,
        referrer_id,
        status,
        default_address_id,
        last_login_at,
        created_at,
        updated_at
     FROM customers 
     WHERE id = ? AND is_deleted = FALSE 
     LIMIT 1`,
    [id]
  );

  if (!rows.length) return null;

  const customer = rows[0];

  // Get referrer name if exists
  if (customer.referrer_id) {
    const [ref] = await db.query(
      "SELECT name FROM customers WHERE id = ?",
      [customer.referrer_id]
    );
    customer.referred_by = ref.length ? ref[0].name : null;
  } else {
    customer.referred_by = null;
  }

  delete customer.referrer_id;


  // Clean status format
  customer.status = customer.status ? customer.status.toLowerCase() : "active";

  // ===== END =====
  
  return formatCustomerDates(customer);
};


const calculateProfileCompletion = (customer, addresses) => {
  let total = 6;
  let completed = 0;

  if (customer.name) completed++;
  if (customer.mobile) completed++;
  if (customer.email) completed++;
  if (customer.gender) completed++;
  if (customer.profile_image) completed++;
  if (addresses && addresses.length > 0) completed++;

  return Math.round((completed / total) * 100);
};


const updateProfile = async (customerId, updateData, imageFile) => {
  const current = await getCustomerById(customerId);
  if (!current) throw new ApiError(404, "Customer not found");

  if (updateData.email && updateData.email !== current.email) {
    const [rows] = await db.query(
      "SELECT google_id, apple_id FROM customers WHERE id = ?",
      [customerId]
    );

    const customer = rows[0];

    // Only OTP users must have unique email
    if (!customer.google_id && !customer.apple_id) {
      const [existing] = await db.query(
        "SELECT id FROM customers WHERE email = ? AND id != ? AND is_deleted = FALSE LIMIT 1",
        [updateData.email, customerId]
      );

      if (existing.length) {
        throw new ApiError(400, "This email address is already registered to another account.");
      }
    }
  }
  let profileImageUrl = current.profile_image;

  if (imageFile) {
    const upload = await s3Service.uploadFile(imageFile, "customers/profile");
    profileImageUrl = upload.url;

    if (current.profile_image) {
      try {
        const oldKey = current.profile_image.split(".amazonaws.com/")[1];
        if (oldKey) await s3Service.deleteFile(oldKey);
      } catch (err) {
        console.warn(`[S3-Cleanup] Failed to delete old profile image: ${err.message}`);
      }
    }
  } else if (updateData.profile_image === null) {
      profileImageUrl = null;
  }

  const allowedFields = ["name", "email", "gender", "default_address_id"];
  const updates = [];
  const values  = [];

  updates.push("profile_image = ?");
  values.push(profileImageUrl);


  // ===== ADD MOBILE LOGIC HERE =====
    if (updateData.mobile && updateData.country_code) {
      const [rows] = await db.query(
        "SELECT mobile, google_id, apple_id FROM customers WHERE id = ?",
        [customerId]
      );

      const customer = rows[0];

      // If mobile already exists → do not allow change
      if (customer.mobile) {
        throw new ApiError(400, "Mobile number already added. You cannot change it.");
      }

      // Allow only Google/Apple users
      if (!customer.google_id && !customer.apple_id) {
        throw new ApiError(400, "Mobile update not allowed for this account.");
      }

      const fullPhone = `${updateData.country_code}${updateData.mobile}`;

      // Check duplicate mobile
      const [existingMobile] = await db.query(
        "SELECT id FROM customers WHERE full_phone = ? AND id != ? LIMIT 1",
        [fullPhone, customerId]
      );

      if (existingMobile.length) {
        throw new ApiError(400, "This mobile number is already registered.");
      }

      updates.push("country_code = ?");
      values.push(updateData.country_code);

      updates.push("mobile = ?");
      values.push(updateData.mobile);

      updates.push("full_phone = ?");
      values.push(fullPhone);
    }
    // ===== END MOBILE LOGIC =====

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }

  if (updates.length > 0) {
    values.push(customerId);
    await db.query(`UPDATE customers SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ? AND is_deleted = FALSE`, values);
    
    // SYNC: If default_address_id was updated, sync the is_default flag in addresses table
    if (updateData.default_address_id) {
       await syncAddressDefaultFlag(customerId, updateData.default_address_id);
    }
  }

  return await getCustomerById(customerId);
};


const getAddresses = async (customerId) => {
  const [rows] = await db.query(
    `SELECT 
        id,
        address_name,
        contact_person_name,
        contact_phone,
        address_line_1,
        address_line_2,
        landmark,
        city,
        state,
        pincode,
        country,
        latitude,
        longitude,
        is_default,
        created_at,
        updated_at
     FROM customers_addresses
     WHERE customer_id = ?
     ORDER BY is_default DESC, created_at DESC`,
    [customerId]
  );

  return formatCustomerDates(rows);
};

const addAddress = async (customerId, addressData) => {
  const currentCustomer = await getCustomerById(customerId);

  // Check if address already exists by name
  const [existing] = await db.query(
    "SELECT id FROM customers_addresses WHERE customer_id = ? AND address_name = ?",
    [customerId, addressData.address_name]
  );

  // If exists → UPDATE instead of INSERT
  if (existing.length > 0) {
    return await updateAddress(customerId, existing[0].id, addressData);
  }

  // Check address limit
  const [countResult] = await db.query(
    "SELECT COUNT(*) as total FROM customers_addresses WHERE customer_id = ?",
    [customerId]
  );

  if (countResult[0].total >= 5) {
    throw new ApiError(400, "Address limit reached (Max 5)");
  }

  const setAsDefault =
    countResult[0].total === 0 || addressData.is_default === true;

  const contactName =
    addressData.contact_person_name || currentCustomer.name;
  const contactPhone =
    addressData.contact_phone || currentCustomer.full_phone;

  const [result] = await db.query(
    `INSERT INTO customers_addresses
    (customer_id, address_name, contact_person_name, contact_phone,
     address_line_1, address_line_2, landmark, city, state, pincode,
     country, latitude, longitude, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      addressData.address_name,
      contactName,
      contactPhone,
      addressData.address_line_1,
      addressData.address_line_2,
      addressData.landmark,
      addressData.city,
      addressData.state,
      addressData.pincode,
      addressData.country,
      addressData.latitude,
      addressData.longitude,
      setAsDefault,
    ]
  );

  if (setAsDefault) {
    await updateDefaultAddress(customerId, result.insertId);
  }

  return await getAddresses(customerId);
};

const updateAddress = async (customerId, addressId, updateData) => {
  const [exists] = await db.query(
    "SELECT id FROM customers_addresses WHERE id = ? AND customer_id = ?",
    [addressId, customerId]
  );

  if (!exists.length) {
    throw new ApiError(404, "Address not found");
  }

  // Prevent duplicate address_name
  if (updateData.address_name) {
    const [duplicate] = await db.query(
      "SELECT id FROM customers_addresses WHERE customer_id = ? AND address_name = ? AND id != ?",
      [customerId, updateData.address_name, addressId]
    );

    if (duplicate.length) {
      throw new ApiError(400, "Address name already exists.");
    }
  }

  await db.query(
    `UPDATE customers_addresses SET
      address_name = ?,
      contact_person_name = ?,
      contact_phone = ?,
      address_line_1 = ?,
      address_line_2 = ?,
      landmark = ?,
      city = ?,
      state = ?,
      pincode = ?,
      country = ?,
      latitude = ?,
      longitude = ?,
      updated_at = NOW()
     WHERE id = ? AND customer_id = ?`,
    [
      updateData.address_name,
      updateData.contact_person_name,
      updateData.contact_phone,
      updateData.address_line_1,
      updateData.address_line_2,
      updateData.landmark,
      updateData.city,
      updateData.state,
      updateData.pincode,
      updateData.country,
      updateData.latitude,
      updateData.longitude,
      addressId,
      customerId,
    ]
  );

  if (updateData.is_default === true) {
    await updateDefaultAddress(customerId, addressId);
  }

  return await getAddresses(customerId);
};

const deleteAddress = async (customerId, addressId) => {

  const [address] = await db.query("SELECT is_default FROM customers_addresses WHERE id = ? AND customer_id = ?", [addressId, customerId]);
  if (!address.length) throw new ApiError(404, "Address not found");

  await db.query("DELETE FROM customers_addresses WHERE id = ? AND customer_id = ?", [addressId, customerId]);
  if (address[0].is_default) {
    const [next] = await db.query("SELECT id FROM customers_addresses WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1", [customerId]);
    if (next.length) await updateDefaultAddress(customerId, next[0].id);
    else await db.query("UPDATE customers SET default_address_id = NULL WHERE id = ?", [customerId]);
  }
  return await getAddresses(customerId);
};

const updateDefaultAddress = async (customerId, addressId) => {
  await db.query(
    "UPDATE customers_addresses SET is_default = 0 WHERE customer_id = ?",
    [customerId]
  );

  await db.query(
    "UPDATE customers_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?",
    [addressId, customerId]
  );

  await db.query(
    "UPDATE customers SET default_address_id = ? WHERE id = ?",
    [addressId, customerId]
  );
};

const syncAddressDefaultFlag = async (customerId, addressId) => {
    // Basic sync: make this address default in the address table without updating the customer table again (prevent loops)
    await db.query("UPDATE customers_addresses SET is_default = FALSE WHERE customer_id = ?", [customerId]);
    await db.query("UPDATE customers_addresses SET is_default = TRUE WHERE id = ? AND customer_id = ?", [addressId, customerId]);
};

const formatCustomerDates = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      is_default: item.is_default === 1 || item.is_default === true,
      last_login_at: formatDate(item.last_login_at),
      created_at: formatDate(item.created_at),
      updated_at: formatDate(item.updated_at)
    }));
  } else {
    return {
      ...data,
      last_login_at: formatDate(data.last_login_at),
      created_at: formatDate(data.created_at),
      updated_at: formatDate(data.updated_at)
    };
  }
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export default { getCustomerById, calculateProfileCompletion, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress };
