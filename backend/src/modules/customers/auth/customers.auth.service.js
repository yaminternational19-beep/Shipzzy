import jwt from "jsonwebtoken";
import db from "../../../config/db.js";
import ApiError from "../../../utils/ApiError.js";

/* ─── Date Formatter Helper ─────────────────────────────────── */
const formatCustomerDates = (customer) => {
  if (!customer) return customer;

  const dateFields = ["created_at", "updated_at", "last_login_at"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  dateFields.forEach((field) => {
    if (customer[field]) {
      const d = new Date(customer[field]);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        customer[field] = `${day}-${month}-${year}`;
      }
    }
  });

  return customer;
};


/* ═══════════════════════════════════════════════════════════════
   CUSTOMER LOOKUPS
═══════════════════════════════════════════════════════════════ */

const getCustomerByPhone = async (country_code, mobile) => {
  const full_phone = `${country_code}${mobile}`;
  const [rows] = await db.query(
    "SELECT * FROM customers WHERE full_phone = ? AND is_deleted = FALSE LIMIT 1",
    [full_phone]
  );
  return formatCustomerDates(rows[0]);
};


const getCustomerById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM customers WHERE id = ? AND is_deleted = FALSE LIMIT 1",
    [id]
  );
  return formatCustomerDates(rows[0]);
};


const getCustomerByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM customers WHERE email = ? AND is_deleted = FALSE LIMIT 1",
    [email]
  );
  return formatCustomerDates(rows[0]);
};


/* ═══════════════════════════════════════════════════════════════
   REFERRAL VALIDATION
═══════════════════════════════════════════════════════════════ */

const validateReferralCode = async (referral_code) => {
  if (!referral_code) return null;
  const [rows] = await db.query(
    "SELECT id FROM customers WHERE referral_code = ? LIMIT 1",
    [referral_code]
  );
  if (!rows.length) throw new ApiError(400, "Invalid referral code");
  return rows[0].id;
};

/* ═══════════════════════════════════════════════════════════════
   UNIFIED OTP REQUEST  (signup + login merged)
═══════════════════════════════════════════════════════════════ */

/**
 * Determines purpose, validates data, stores OTP, returns { token, otp, purpose }
 */
const requestOtp = async ({
  country_code,
  mobile,
  name,
  email,
  device_id,
  player_id,
  device_type,
  app_version,
  referral_code
}) => {
  const full_phone = `${country_code}${mobile}`;

  // --- Determine purpose ---
  const existing = await getCustomerByPhone(country_code, mobile);

  // Block suspended / terminated accounts immediately
  if (existing && existing.status !== "active") {
    throw new ApiError(403, `Account is ${existing.status}. Please contact support.`);
  }

  const purpose = existing ? "login" : "signup";

  // --- Signup-specific validations ---
  let referrer_id = null;
  if (purpose === "signup") {
    referrer_id = await validateReferralCode(referral_code);
  }

  // --- Generate OTP & token ---
  const otp = generateOtp();

  const tokenPayload = {
    country_code,
    mobile,
    full_phone,
    name: name || null,
    email: email || null,
    device_id,
    player_id,
    device_type: device_type || null,
    app_version: app_version || null,
    referrer_id,
    purpose
  };

  const token = generateToken(tokenPayload);

  // --- Store OTP ---
  await storeOtp(full_phone, otp, purpose, token);

  return { token, otp, purpose };
};

/* ═══════════════════════════════════════════════════════════════
   OTP GENERATE / STORE / VERIFY / RESEND
═══════════════════════════════════════════════════════════════ */

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const storeOtp = async (phone, otp, purpose, token) => {
  const expiresAt = new Date(
    Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000
  );
  const now = new Date();

  await db.query(
    `INSERT INTO otp_verifications
      (phone, otp, token, expires_at, last_sent_at, purpose)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [phone, otp, token, expiresAt, now, purpose]
  );
};

const verifyOtp = async (phone, otp, purpose, token) => {
  const MAX = Number(process.env.MAX_OTP_ATTEMPTS) || 5;

  const [rows] = await db.query(
    `SELECT * FROM otp_verifications
     WHERE phone   = ?
       AND purpose = ?
       AND token   = ?
       AND verified = FALSE
     ORDER BY id DESC
     LIMIT 1`,
    [phone, purpose, token]
  );

  if (!rows.length) {
    // Distinguish replay (already verified) vs wrong/foreign session token.
    // Replay → 400;  Cross-session attack / invalid token → 401.
    const [verifiedRows] = await db.query(
      "SELECT id FROM otp_verifications WHERE token = ? AND verified = TRUE LIMIT 1",
      [token]
    );
    if (verifiedRows.length) {
      throw new ApiError(400, "OTP has already been verified. Please request a new OTP.");
    }
    throw new ApiError(401, "Invalid or expired OTP session. Please request OTP again.");
  }

  const otpRow = rows[0];

  // 1. Expiry check
  if (new Date() > new Date(otpRow.expires_at))
    throw new ApiError(400, "OTP has expired. Please request a new one.");

  // 2. Already exhausted all attempts from a prior call
  if (otpRow.attempts >= MAX)
    throw new ApiError(429, "Too many incorrect OTP attempts. Request a new OTP.");

  // 3. Wrong OTP → increment FIRST, then decide whether to lock or warn
  if (otpRow.otp !== otp) {
    await db.query(
      "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?",
      [otpRow.id]
    );
    const newAttempts = otpRow.attempts + 1;
    // Lock on the MAX-th wrong attempt
    if (newAttempts >= MAX) {
      throw new ApiError(429, "Too many incorrect OTP attempts. Request a new OTP.");
    }
    const remaining = MAX - newAttempts;
    throw new ApiError(401, `Incorrect OTP. ${remaining} attempt(s) remaining.`);
  }

  // 4. Correct → mark verified
  await db.query(
    "UPDATE otp_verifications SET verified = TRUE WHERE id = ?",
    [otpRow.id]
  );

  return true;
};

const resendOtp = async (phone, purpose, token) => {
  const [rows] = await db.query(
    `SELECT * FROM otp_verifications
     WHERE phone   = ?
       AND purpose = ?
       AND token   = ?
       AND verified = FALSE
     ORDER BY id DESC
     LIMIT 1`,
    [phone, purpose, token]
  );

  if (!rows.length)
    throw new ApiError(400, "Session expired or already verified. Please request OTP again.");

  const otpRow = rows[0];
  const now = new Date();
  const lastSent = new Date(otpRow.last_sent_at);
  const createdAt = new Date(otpRow.created_at);

  // 30-second cooldown
  if (otpRow.last_sent_at && now - lastSent < 30000)
    throw new ApiError(429, "Please wait 30 seconds before requesting a new OTP.");

  // Max resend limit per hour
  const maxResends = Number(process.env.MAX_OTP_RESENDS) || 5;
  if (otpRow.send_count >= maxResends && now - createdAt < 3_600_000)
    throw new ApiError(429, "OTP resend limit reached. Try again after 1 hour.");

  const newOtp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.query(
    `UPDATE otp_verifications
        SET otp        = ?,
            expires_at = ?,
            attempts   = 0,
            send_count = send_count + 1,
            last_sent_at = ?
      WHERE id = ?`,
    [newOtp, expiresAt, now, otpRow.id]
  );

  return newOtp;
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOMER CREATE / UPDATE
═══════════════════════════════════════════════════════════════ */

const createCustomer = async ({
  country_code,
  mobile,
  full_phone,
  name,
  email,
  device_id,
  player_id,
  referrer_id
}) => {
  const referralCode = await generateUniqueReferralCode();

  const [result] = await db.query(
    `INSERT INTO customers
       (country_code, mobile, full_phone, name, email, device_id, player_id,
        referral_code, referrer_id, login_type, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'otp', NOW())`,
    [
      country_code,
      mobile,
      full_phone,
      name || null,
      email || null,
      device_id,
      player_id,
      referralCode,
      referrer_id || null
    ]
  );

  return getCustomerById(result.insertId);
};

const linkPhoneToCustomer = async (customerId, {
  country_code,
  mobile,
  full_phone,
  name,
  device_id,
  player_id
}) => {
  await db.query(
    `UPDATE customers SET
       country_code   = ?,
       mobile         = ?,
       full_phone     = ?,
       name           = COALESCE(?, name),
       device_id      = ?,
       player_id      = ?,
       login_type     = 'otp',
       last_login_at  = NOW()
     WHERE id = ?`,
    [country_code, mobile, full_phone, name || null, device_id, player_id, customerId]
  );
};

const updateLoginDetails = async (customerId, loginType) => {
  await db.query(
    "UPDATE customers SET login_type = ?, last_login_at = NOW() WHERE id = ?",
    [loginType, customerId]
  );
};

/* ═══════════════════════════════════════════════════════════════
   UNIFIED OTP VERIFY → returns { accessToken, refreshToken, customer }
═══════════════════════════════════════════════════════════════ */

const completeOtpAuth = async (decoded, rawToken, ipAddress, userAgent) => {
  const { country_code, mobile, full_phone, purpose } = decoded;

  // Verify OTP in DB (already verified by caller, but confirm token is valid)
  // customer resolution
  let customer = await getCustomerByPhone(country_code, mobile);

  if (!customer && purpose === "signup") {
    // Email-linking check
    if (decoded.email) {
      const byEmail = await getCustomerByEmail(decoded.email);
      if (byEmail) {
        // Guard: block suspended/terminated
        if (byEmail.status !== "active")
          throw new ApiError(403, `Account is ${byEmail.status}. Contact support.`);
        await linkPhoneToCustomer(byEmail.id, decoded);
        customer = await getCustomerById(byEmail.id);
      }
    }

    if (!customer) {
      customer = await createCustomer(decoded);
    }
  }

  if (!customer) throw new ApiError(404, "Customer not found");

  // Block suspended / terminated
  if (customer.status !== "active")
    throw new ApiError(403, `Account is ${customer.status}. Contact support.`);

  // Update login tracking
  await updateLoginDetails(customer.id, "otp");

  // Store / update device
  await storeCustomerDevice({
    customer_id: customer.id,
    device_id: decoded.device_id,
    player_id: decoded.player_id,
    device_type: decoded.device_type,
    app_version: decoded.app_version
  });

  // Tokens
  const accessToken = generateAccessToken(customer);
  const refreshToken = generateRefreshToken(customer);

  await storeRefreshToken(
    customer.id,
    refreshToken,
    decoded.device_id,
    ipAddress,
    userAgent
  );

  // Refresh customer from DB to return latest state
  customer = await getCustomerById(customer.id);

  return { accessToken, refreshToken, customer };
};

/* ═══════════════════════════════════════════════════════════════
   DEVICE MANAGEMENT
═══════════════════════════════════════════════════════════════ */

const storeCustomerDevice = async ({
  customer_id,
  device_id,
  player_id,
  device_type,
  app_version
}) => {
  await db.query(
    `INSERT INTO customers_devices
       (customer_id, device_id, player_id, device_type, app_version, last_login_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       player_id    = VALUES(player_id),
       device_type  = VALUES(device_type),
       app_version  = VALUES(app_version),
       last_login_at = NOW(),
       is_active    = TRUE`,
    [customer_id, device_id, player_id, device_type || null, app_version || null]
  );
};

/* ═══════════════════════════════════════════════════════════════
   TOKEN UTILITIES
═══════════════════════════════════════════════════════════════ */

const generateToken = (data) =>
  jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.OTP_TOKEN_EXPIRY || "10m"
  });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const generateAccessToken = (customer) =>
  jwt.sign(
    { id: customer.id, role: "CUSTOMER" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );

const generateRefreshToken = (customer) =>
  jwt.sign(
    { id: customer.id, role: "CUSTOMER", type: "REFRESH" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d" }
  );

/* ═══════════════════════════════════════════════════════════════
   SESSION MANAGEMENT
═══════════════════════════════════════════════════════════════ */

const storeRefreshToken = async (
  customerId,
  refreshToken,
  deviceId,
  ipAddress,
  userAgent
) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO customers_sessions
       (customer_id, refresh_token, device_id, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       refresh_token = VALUES(refresh_token),
       expires_at    = VALUES(expires_at),
       ip_address    = VALUES(ip_address),
       user_agent    = VALUES(user_agent)`,
    [customerId, refreshToken, deviceId, expiresAt, ipAddress, userAgent]
  );
};

const refreshSession = async (oldRefreshToken) => {
  const [rows] = await db.query(
    `SELECT * FROM customers_sessions
     WHERE refresh_token = ?
       AND expires_at > NOW()
       AND is_revoked = FALSE
     LIMIT 1`,
    [oldRefreshToken]
  );

  if (!rows.length)
    throw new ApiError(401, "Invalid or expired refresh token");

  const session = rows[0];
  const customer = await getCustomerById(session.customer_id);

  if (!customer)
    throw new ApiError(404, "Customer account not found");

  if (customer.status !== "active")
    throw new ApiError(403, `Account is ${customer.status}`);

  const newAccessToken = generateAccessToken(customer);
  const newRefreshToken = generateRefreshToken(customer);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Rotate: update in-place so (customer_id, device_id) unique key is preserved
  await db.query(
    `UPDATE customers_sessions
        SET refresh_token = ?, expires_at = ?, is_revoked = FALSE
      WHERE id = ?`,
    [newRefreshToken, expiresAt, session.id]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutCustomer = async (refreshToken, logoutAll = false) => {
  // Accept non-expired OR already-expired tokens so logout never fails silently
  const [rows] = await db.query(
    "SELECT * FROM customers_sessions WHERE refresh_token = ? LIMIT 1",
    [refreshToken]
  );

  if (!rows.length) throw new ApiError(400, "Invalid or already expired session");

  const session = rows[0];

  if (logoutAll) {
    // Revoke all sessions for this customer first, then delete
    await db.query(
      "UPDATE customers_sessions SET is_revoked = TRUE WHERE customer_id = ?",
      [session.customer_id]
    );
    await db.query(
      "DELETE FROM customers_sessions WHERE customer_id = ?",
      [session.customer_id]
    );
    await db.query(
      "UPDATE customers_devices SET is_active = FALSE WHERE customer_id = ?",
      [session.customer_id]
    );
  } else {
    // Revoke then delete single session
    await db.query(
      "UPDATE customers_sessions SET is_revoked = TRUE WHERE id = ?",
      [session.id]
    );
    await db.query(
      "DELETE FROM customers_sessions WHERE id = ?",
      [session.id]
    );
    if (session.device_id) {
      await db.query(
        "UPDATE customers_devices SET is_active = FALSE WHERE customer_id = ? AND device_id = ?",
        [session.customer_id, session.device_id]
      );
    }
  }

  return true;
};

/* ═══════════════════════════════════════════════════════════════
   SOCIAL LOGIN  (Google / Apple with full account linking)
═══════════════════════════════════════════════════════════════ */

const findOrCreateSocialCustomer = async ({
  provider,
  provider_id,
  email,
  name,
  profile_image,
  device_id,
  player_id,
  device_type,
  app_version
}) => {
  let customer;

  // 1. Find by provider ID
  if (provider === "google") {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE google_id = ? AND is_deleted = FALSE LIMIT 1",
      [provider_id]
    );
    customer = rows[0];
  }

  if (provider === "apple") {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE apple_id = ? AND is_deleted = FALSE LIMIT 1",
      [provider_id]
    );
    customer = rows[0];
  }

  // 2. Account linking: find by email → link provider ID
  if (!customer && email) {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE email = ? AND is_deleted = FALSE LIMIT 1",
      [email]
    );
    customer = rows[0];

    if (customer) {
      const col = provider === "google" ? "google_id" : "apple_id";
      if (!customer[col]) {
        await db.query(`UPDATE customers SET ${col} = ? WHERE id = ?`, [
          provider_id,
          customer.id
        ]);
      }
    }
  }

  // 3. Create new customer
  if (!customer) {
    const referralCode = await generateUniqueReferralCode();
    const [result] = await db.query(
      `INSERT INTO customers
         (name, email, profile_image, google_id, apple_id, login_type, referral_code, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name || null,
        email || null,
        profile_image || null,
        provider === "google" ? provider_id : null,
        provider === "apple" ? provider_id : null,
        provider,
        referralCode
      ]
    );
    customer = await getCustomerById(result.insertId);
  }

  // Guard: block inactive accounts
  if (customer.status !== "active")
    throw new ApiError(403, `Account is ${customer.status}. Contact support.`);

  await updateLoginDetails(customer.id, provider);
  await storeCustomerDevice({ customer_id: customer.id, device_id, player_id, device_type, app_version });

  return await getCustomerById(customer.id);
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

const generateUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = "REF" + Math.floor(100000 + Math.random() * 900000);
    const [rows] = await db.query(
      "SELECT id FROM customers WHERE referral_code = ?",
      [code]
    );
    if (!rows.length) exists = false;
  }

  return code;
};

/* ═══════════════════════════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════════════════════════ */

export default {
  // OTP flow
  requestOtp,
  verifyOtp,
  resendOtp,
  completeOtpAuth,

  // Lookups
  getCustomerByPhone,
  getCustomerByEmail,
  getCustomerById,

  // Customer mutation
  createCustomer,
  linkPhoneToCustomer,
  updateLoginDetails,
  storeCustomerDevice,

  // Tokens
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,

  // Session
  storeRefreshToken,
  refreshSession,
  logoutCustomer,

  // Social login
  findOrCreateSocialCustomer,

  // Utilities
  generateOtp,
  validateReferralCode,
  generateUniqueReferralCode
};