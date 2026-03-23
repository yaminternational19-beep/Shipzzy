import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../../config/db.js';

/* ===============================
   FIND USER BY EMAIL (ALL ROLES)
================================= */

const getUserByEmail = async (email) => {

  const [admin] = await db.query(
    "SELECT id,name,email,password,status,'SUPER_ADMIN' role FROM super_admins WHERE email=?",
    [email]
  );

  if (admin.length) return admin[0];

  const [subadmin] = await db.query(
    "SELECT id,name,email,password,'SUB_ADMIN' role FROM sub_admins WHERE email=?",
    [email]
  );
  if (subadmin.length) return subadmin[0];

  let vendor = [];
  try {
    const [vRows] = await db.query(
      "SELECT id,name,email,password,'VENDOR_OWNER' role FROM vendors WHERE email=?",
      [email]
    );
    vendor = vRows;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    // vendors table missing: ignore and continue
  }

  if (vendor.length) return vendor[0];

  let staff = [];
  try {
    const [sRows] = await db.query(
      "SELECT id,name,email,password,'VENDOR_STAFF' role FROM vendor_staff WHERE email=?",
      [email]
    );
    staff = sRows;
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    // vendor_staff table missing: ignore and continue
  }

  if (staff.length) return staff[0];

  return null;
};

/* ===============================
   PASSWORD CHECK
================================= */

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/* ===============================
   OTP GENERATION
================================= */

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* ===============================
   STORE OTP
================================= */

const storeOtp = async (userId, role, otp, type) => {

  await db.query(
    `INSERT INTO otp_codes
    (user_id,user_type,otp_code,otp_type,expires_at)
    VALUES (?, ?, ?, ?, NOW() + INTERVAL 5 MINUTE)`,
    [userId, role, otp, type]
  );

};

/* ===============================
   VERIFY OTP
================================= */

const verifyOtp = async (userId, role, otp, type) => {

  const [rows] = await db.query(
    `SELECT * FROM otp_codes
     WHERE user_id=? 
     AND user_type=? 
     AND otp_code=? 
     AND otp_type=? 
     AND expires_at > NOW()
     AND is_used=FALSE`,
    [userId, role, otp, type]
  );

  if (!rows.length) return false;

  await db.query(
    "UPDATE otp_codes SET is_used=TRUE WHERE id=?",
    [rows[0].id]
  );

  return true;
};

/* ===============================
   TOKEN GENERATORS
================================= */

const generateLoginToken = (user) => {

  return jwt.sign(
    { id: user.id, role: user.role, type: "LOGIN_OTP" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

};

const generateResetOtpToken = (user) => {

  return jwt.sign(
    { id: user.id, role: user.role, type: "RESET_OTP" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

};

const generateResetToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      type: "RESET_PASSWORD"
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

const generateAccessToken = (user) => {

  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

};

const generateRefreshToken = (user) => {

  return jwt.sign(
    { id: user.id, role: user.role, type: "REFRESH_TOKEN" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

};

/* ===============================
   VERIFY LOGIN TOKEN
================================= */

const verifyLoginToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

/* ===============================
    UPDATE OTP
================================= */

const updateOtp = async (userId, role, otp) => {

  const [result] = await db.query(
    `UPDATE otp_codes
     SET otp_code = ?, expires_at = NOW() + INTERVAL 5 MINUTE, is_used = FALSE
     WHERE user_id = ? AND user_type = ? AND otp_type = 'login'
     ORDER BY id DESC
     LIMIT 1`,
    [otp, userId, role]
  );

  return result.affectedRows > 0;
};
const getUserById = async (id, role) => {

  if (role === "SUPER_ADMIN") {
    const [rows] = await db.query(
      "SELECT email FROM super_admins WHERE id=?",
      [id]
    );
    return rows[0];
  }

  if (role === "SUB_ADMIN") {
    const [rows] = await db.query(
      "SELECT email FROM sub_admins WHERE id=?",
      [id]
    );
    return rows[0];
  }

  if (role === "VENDOR_OWNER") {
    const [rows] = await db.query(
      "SELECT email FROM vendors WHERE id=?",
      [id]
    );
    return rows[0];
  }

  if (role === "VENDOR_STAFF") {
    const [rows] = await db.query(
      "SELECT email FROM vendor_staff WHERE id=?",
      [id]
    );
    return rows[0];
  }

};


/* ===============================
   STORE REFRESH TOKEN
================================= */

const storeRefreshToken = async (userId, role, token) => {

  await db.query(
    `INSERT INTO refresh_tokens
     (user_id,user_type,refresh_token,expires_at)
     VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY)`,
    [userId, role, token]
  );

};

/* ===============================
   REFRESH ACCESS TOKEN
================================= */

const refreshAccessToken = async (token) => {

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      "SELECT * FROM refresh_tokens WHERE refresh_token=? AND is_revoked=FALSE",
      [token]
    );

    if (!rows.length) return null;

    return generateAccessToken({
      id: decoded.id,
      role: rows[0].user_type
    });

  } catch {
    return null;
  }

};

/* ===============================
   LOGOUT
================================= */

const logout = async (token) => {

  await db.query(
    "UPDATE refresh_tokens SET is_revoked=TRUE WHERE refresh_token=?",
    [token]
  );

  return true;

};

/* ===============================
   RESET PASSWORD
================================= */

const resetPassword = async (userId, role, newPassword) => {

  const hash = await bcrypt.hash(newPassword, 10);

  if (role === "SUPER_ADMIN") {
    await db.query(
      "UPDATE super_admins SET password=? WHERE id=?",
      [hash, userId]
    );
  }

  if (role === "SUB_ADMIN") {
    await db.query(
      "UPDATE sub_admins SET password=? WHERE id=?",
      [hash, userId]
    );
  }

  if (role === "VENDOR_OWNER") {
    await db.query(
      "UPDATE vendors SET password=? WHERE id=?",
      [hash, userId]
    );
  }

  if (role === "VENDOR_STAFF") {
    await db.query(
      "UPDATE vendor_staff SET password=? WHERE id=?",
      [hash, userId]
    );
  }

  return true;

};

/* ===============================
   EXPORTS
================================= */

export default {

  getUserByEmail,
  verifyPassword,
  generateOtp,
  storeOtp,
  verifyOtp,

  updateOtp,
  getUserById,

  generateLoginToken,
  generateResetOtpToken,
  generateResetToken,
  generateAccessToken,
  generateRefreshToken,

  verifyLoginToken,

  storeRefreshToken,
  refreshAccessToken,
  logout,

  resetPassword

};