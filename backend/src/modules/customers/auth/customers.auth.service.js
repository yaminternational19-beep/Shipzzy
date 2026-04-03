import jwt from "jsonwebtoken";
import db from "../../../config/db.js";
import ApiError from "../../../utils/ApiError.js";

const formatCustomerDates = (customer) => {
  if (!customer) return customer;
  const dateFields = ["created_at", "updated_at", "last_login_at"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  dateFields.forEach((field) => {
    if (customer[field]) {
      const d = new Date(customer[field]);
      if (!isNaN(d.getTime())) {
        customer[field] = `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
      }
    }
  });
  return customer;
};

const getCustomerByPhone = async (country_code, mobile) => {
  const full_phone = `${country_code}${mobile}`;
  const [rows] = await db.query("SELECT * FROM customers WHERE full_phone = ? AND is_deleted = FALSE LIMIT 1", [full_phone]);
  return formatCustomerDates(rows[0]);
};



const getCustomerById = async (id) => {
  const [rows] = await db.query("SELECT * FROM customers WHERE id = ? AND is_deleted = FALSE LIMIT 1", [id]);
  return formatCustomerDates(rows[0]);
};

const getCustomerByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM customers WHERE email = ? AND is_deleted = FALSE LIMIT 1", [email]);
  return formatCustomerDates(rows[0]);
};

const validateReferralCode = async (referral_code) => {
  if (!referral_code) return null;
  const [rows] = await db.query("SELECT id FROM customers WHERE referral_code = ? LIMIT 1", [referral_code]);
  if (!rows.length) throw new ApiError(400, "Invalid referral code");
  return rows[0].id;
};

// const requestOtp = async ({ country_code, mobile, name, email, device_id, player_id, device_type, app_version, referral_code }) => {
//   const full_phone = `${country_code}${mobile}`;
//   const existing = await getCustomerByPhone(country_code, mobile);
//   if (existing && existing.status !== "active") throw new ApiError(403, `Account is ${existing.status}.`);
//   const purpose = existing ? "login" : "signup";
//   let referrer_id = null;
//   if (purpose === "signup") referrer_id = await validateReferralCode(referral_code);
//   const otp = generateOtp();
//   const token = generateToken({ country_code, mobile, full_phone, name: name || null, email: email || null, device_id, player_id, device_type: device_type || null, app_version: app_version || null, referrer_id, purpose });
//   await storeOtp(full_phone, otp, purpose, token);
//   return { token, otp, purpose };
// };

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
  const existing = await getCustomerByPhone(country_code, mobile);

  // If customer exists → check status
  if (existing) {
    if (existing.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.");
    }

    if (existing.status === "terminated") {
      throw new ApiError(403, "Your account has been terminated. Please register with a new mobile number.");
    }
  }

  const purpose = existing ? "login" : "signup";

  let referrer_id = null;
  if (purpose === "signup") {
    referrer_id = await validateReferralCode(referral_code);
  }

  const otp = generateOtp();

  const token = generateToken({
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
  });

  await storeOtp(full_phone, otp, purpose, token);

  return { token, otp, purpose };
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const storeOtp = async (phone, otp, purpose, token) => {
  const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);
  await db.query("INSERT INTO otp_verifications (phone, otp, token, expires_at, last_sent_at, purpose) VALUES (?, ?, ?, ?, ?, ?)", [phone, otp, token, expiresAt, new Date(), purpose]);
};

const verifyOtp = async (phone, otp, purpose, token) => {
  const MAX = Number(process.env.MAX_OTP_ATTEMPTS) || 5;
  const [rows] = await db.query("SELECT * FROM otp_verifications WHERE phone = ? AND purpose = ? AND token = ? AND verified = FALSE ORDER BY id DESC LIMIT 1", [phone, purpose, token]);
  if (!rows.length) {
    const [verifiedRows] = await db.query("SELECT id FROM otp_verifications WHERE token = ? AND verified = TRUE LIMIT 1", [token]);
    if (verifiedRows.length) throw new ApiError(400, "OTP already verified.");
    throw new ApiError(401, "Invalid OTP session.");
  }
  const otpRow = rows[0];
  if (new Date() > new Date(otpRow.expires_at)) throw new ApiError(400, "OTP expired.");
  if (otpRow.attempts >= MAX) throw new ApiError(429, "Too many attempts.");
  if (otpRow.otp !== otp) {
    await db.query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?", [otpRow.id]);
    if (otpRow.attempts + 1 >= MAX) throw new ApiError(429, "Too many attempts.");
    throw new ApiError(401, `Incorrect OTP. ${MAX - (otpRow.attempts + 1)} attempts left.`);
  }
  await db.query("UPDATE otp_verifications SET verified = TRUE WHERE id = ?", [otpRow.id]);
  return true;
};

const resendOtp = async (phone, purpose, token) => {
  const [rows] = await db.query("SELECT * FROM otp_verifications WHERE phone = ? AND purpose = ? AND token = ? AND verified = FALSE ORDER BY id DESC LIMIT 1", [phone, purpose, token]);
  if (!rows.length) throw new ApiError(400, "Session expired.");
  const otpRow = rows[0];
  if (Date.now() - new Date(otpRow.last_sent_at) < 30000) throw new ApiError(429, "Wait 30 seconds.");
  if (otpRow.send_count >= (Number(process.env.MAX_OTP_RESENDS) || 5)) throw new ApiError(429, "Resend limit reached.");
  const newOtp = generateOtp();
  await db.query("UPDATE otp_verifications SET otp = ?, expires_at = ?, attempts = 0, send_count = send_count + 1, last_sent_at = NOW() WHERE id = ?", [newOtp, new Date(Date.now() + 5 * 60 * 1000), otpRow.id]);
  return newOtp;
};

const completeOtpAuth = async (decoded, rawToken, ipAddress, userAgent) => {
  let customer = await getCustomerByPhone(decoded.country_code, decoded.mobile);
  if (!customer && decoded.purpose === "signup") {
    if (decoded.email) {
      const byEmail = await getCustomerByEmail(decoded.email);
      if (byEmail) {
        if (byEmail.status !== "active") throw new ApiError(403, `Account is ${byEmail.status}.`);
        await linkPhoneToCustomer(byEmail.id, decoded);
        customer = await getCustomerById(byEmail.id);
      }
    }
    if (!customer) customer = await createCustomer(decoded);
  }
  if (!customer) throw new ApiError(404, "Customer not found");
  if (customer.status !== "active") throw new ApiError(403, `Account ${customer.status}.`);
  await updateLoginDetails(customer.id, "otp");
  await storeCustomerDevice({ customer_id: customer.id, device_id: decoded.device_id, player_id: decoded.player_id, device_type: decoded.device_type, app_version: decoded.app_version });
  const accessToken = generateAccessToken(customer);
  const refreshToken = generateRefreshToken(customer);
  await storeRefreshToken(customer.id, refreshToken, decoded.device_id, ipAddress, userAgent);
  return { accessToken, refreshToken, customer: await getCustomerById(customer.id) };
};

const createCustomer = async ({ country_code, mobile, full_phone, name, email, device_id, player_id, referrer_id }) => {
  const referralCode = await generateUniqueReferralCode();
  const [result] = await db.query("INSERT INTO customers (country_code, mobile, full_phone, name, email, device_id, player_id, referral_code, referrer_id, login_type, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'otp', NOW())", [country_code, mobile, full_phone, name || null, email || null, device_id, player_id, referralCode, referrer_id || null]);
  return getCustomerById(result.insertId);
};

const linkPhoneToCustomer = async (customerId, { country_code, mobile, full_phone, name, device_id, player_id }) => {
  await db.query("UPDATE customers SET country_code = ?, mobile = ?, full_phone = ?, name = COALESCE(?, name), device_id = ?, player_id = ?, login_type = 'otp', last_login_at = NOW() WHERE id = ?", [country_code, mobile, full_phone, name || null, device_id, player_id, customerId]);
};

const updateLoginDetails = async (customerId, loginType) => {
  await db.query("UPDATE customers SET login_type = ?, last_login_at = NOW() WHERE id = ?", [loginType, customerId]);
};

const storeCustomerDevice = async ({ customer_id, device_id, player_id, device_type, app_version }) => {
  await db.query("INSERT INTO customers_devices (customer_id, device_id, player_id, device_type, app_version, last_login_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE player_id = VALUES(player_id), device_type = VALUES(device_type), app_version = VALUES(app_version), last_login_at = NOW(), is_active = TRUE", [customer_id, device_id, player_id, device_type || null, app_version || null]);
};

const generateToken = (data) => jwt.sign(data, process.env.JWT_SECRET, { expiresIn: process.env.OTP_TOKEN_EXPIRY || "10m" });
const verifyToken = (token) => { try { return jwt.verify(token, process.env.JWT_SECRET); } catch { return null; } };
const generateAccessToken = (customer) => jwt.sign({ id: customer.id, role: "CUSTOMER" }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" });
const generateRefreshToken = (customer) => jwt.sign({ id: customer.id, role: "CUSTOMER", type: "REFRESH" }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d" });

const storeRefreshToken = async (customerId, refreshToken, deviceId, ipAddress, userAgent) => {
  await db.query("INSERT INTO customers_sessions (customer_id, refresh_token, device_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at), ip_address = VALUES(ip_address), user_agent = VALUES(user_agent)", [customerId, refreshToken, deviceId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ipAddress, userAgent]);
};

const refreshSession = async (oldRefreshToken) => {
  const [rows] = await db.query("SELECT * FROM customers_sessions WHERE refresh_token = ? AND expires_at > NOW() AND is_revoked = FALSE LIMIT 1", [oldRefreshToken]);
  if (!rows.length) throw new ApiError(401, "Invalid refresh token");
  const session = rows[0];
  const customer = await getCustomerById(session.customer_id);
  if (!customer || customer.status !== "active") throw new ApiError(403, "Invalid account");
  const newAccessToken = generateAccessToken(customer);
  const newRefreshToken = generateRefreshToken(customer);
  await db.query("UPDATE customers_sessions SET refresh_token = ?, expires_at = ?, is_revoked = FALSE WHERE id = ?", [newRefreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), session.id]);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutCustomer = async (refreshToken, logoutAll = false) => {
  const [rows] = await db.query("SELECT * FROM customers_sessions WHERE refresh_token = ? LIMIT 1", [refreshToken]);
  if (!rows.length) throw new ApiError(400, "Invalid session");
  const session = rows[0];
  if (logoutAll) {
    await db.query("DELETE FROM customers_sessions WHERE customer_id = ?", [session.customer_id]);
    await db.query("UPDATE customers_devices SET is_active = FALSE WHERE customer_id = ?", [session.customer_id]);
  } else {
    await db.query("DELETE FROM customers_sessions WHERE id = ?", [session.id]);
    if (session.device_id) await db.query("UPDATE customers_devices SET is_active = FALSE WHERE customer_id = ? AND device_id = ?", [session.customer_id, session.device_id]);
  }
  return true;
};

const findOrCreateSocialCustomer = async ({ provider, provider_id, email, name, profile_image, device_id, player_id, device_type, app_version }) => {
  let customer;
  const col = provider === "google" ? "google_id" : "apple_id";
  const [rows] = await db.query(`SELECT * FROM customers WHERE ${col} = ? AND is_deleted = FALSE LIMIT 1`, [provider_id]);
  customer = rows[0];
  if (!customer && email) {
    const [emailRows] = await db.query("SELECT * FROM customers WHERE email = ? AND is_deleted = FALSE LIMIT 1", [email]);
    customer = emailRows[0];
    if (customer && !customer[col]) await db.query(`UPDATE customers SET ${col} = ? WHERE id = ?`, [provider_id, customer.id]);
  }
  if (!customer) {
    const referralCode = await generateUniqueReferralCode();
    const [result] = await db.query(`INSERT INTO customers (name, email, profile_image, ${col}, login_type, referral_code, last_login_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`, [name || null, email || null, profile_image || null, provider_id, provider, referralCode]);
    customer = await getCustomerById(result.insertId);
  }
  if (customer.status !== "active") throw new ApiError(403, `Account ${customer.status}.`);
  await updateLoginDetails(customer.id, provider);
  await storeCustomerDevice({ customer_id: customer.id, device_id, player_id, device_type, app_version });
  return await getCustomerById(customer.id);
};

const generateUniqueReferralCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = "REF" + Math.floor(100000 + Math.random() * 900000);
    const [rows] = await db.query("SELECT id FROM customers WHERE referral_code = ?", [code]);
    if (!rows.length) exists = false;
  }
  return code;
};

export default { requestOtp, verifyOtp, resendOtp, completeOtpAuth, getCustomerByPhone, getCustomerByEmail, getCustomerById, createCustomer, linkPhoneToCustomer, updateLoginDetails, storeCustomerDevice, generateToken, verifyToken, generateAccessToken, generateRefreshToken, storeRefreshToken, refreshSession, logoutCustomer, findOrCreateSocialCustomer, generateOtp, validateReferralCode, generateUniqueReferralCode };