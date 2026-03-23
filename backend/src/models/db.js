import db from '../config/db.js';

const TABLES = [
    {
        name: "super_admins",
        query: `
            CREATE TABLE IF NOT EXISTS super_admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(150) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                status ENUM('active','inactive') DEFAULT 'active',
                INDEX idx_email (email),
                INDEX idx_status (status)
            );
        `

    },
    {
        name: "otp_codes",
        query: `
            CREATE TABLE IF NOT EXISTS otp_codes (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                otp_type VARCHAR(30) NOT NULL,
                expires_at DATETIME NOT NULL,
                attempts INT DEFAULT 0,
                resend_count INT DEFAULT 0,
                is_used BOOLEAN DEFAULT FALSE,

                INDEX idx_user_id (user_id),
                INDEX idx_otp_code (otp_code),
                INDEX idx_expires_at (expires_at),
                INDEX idx_user_otp (user_id, otp_code, otp_type)
            );
        `
    },
    {
        name:"refresh_tokens",
        query: `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                refresh_token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                is_revoked BOOLEAN DEFAULT FALSE,
                INDEX idx_user_id (user_id),
                INDEX idx_user_type (user_type),
                INDEX idx_expires_at (expires_at),
                INDEX idx_is_revoked (is_revoked)
            );
        `
    },
    {
        name:"sub_admins",
        query: `
            CREATE TABLE IF NOT EXISTS sub_admins (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                country_code VARCHAR(10) DEFAULT '+91',
                mobile VARCHAR(20) NOT NULL,
                address TEXT,
                state VARCHAR(100),
                country VARCHAR(100) DEFAULT 'India',
                pincode VARCHAR(10),
                emergency_country_code VARCHAR(10) DEFAULT '+91',
                emergency_mobile VARCHAR(20),
                role VARCHAR(100) NOT NULL,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                profile_photo_key VARCHAR(255) NULL,
                profile_photo VARCHAR(255),
                permissions JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_role (role),
                INDEX idx_created_at (created_at)
            );
        `           
    },
    {
        name: "categories",
        query: `
            CREATE TABLE IF NOT EXISTS categories (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                category_code VARCHAR(20) UNIQUE,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon TEXT,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            );
        `
    },
    {
        name: "subcategories",
        query: `
            CREATE TABLE IF NOT EXISTS subcategories (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                subcategory_code VARCHAR(20) UNIQUE,
                category_id BIGINT NOT NULL,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                icon TEXT,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                INDEX idx_category_id (category_id),
                INDEX idx_name (name),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            );
        `
    },
    {
        name: "brands",
        query: `
            CREATE TABLE IF NOT EXISTS brands (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                brand_code VARCHAR(20) UNIQUE,
                name VARCHAR(150) NOT NULL,
                category_id BIGINT NOT NULL,
                subcategory_id BIGINT NOT NULL,
                logo TEXT,
                description TEXT,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
                INDEX idx_category_id (category_id),
                INDEX idx_subcategory_id (subcategory_id),
                INDEX idx_name (name),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            );
        `
    },
    {
        name: "Tiers",
        query:`
            CREATE TABLE IF NOT EXISTS tiers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tier_key VARCHAR(50),             
                tier_name VARCHAR(50) NOT NULL,   
                tier_order INT DEFAULT 0,                
                threshold_text VARCHAR(100),            
                min_turnover DECIMAL(10,2) DEFAULT 0,
                commission_percent DECIMAL(5,2) DEFAULT 0,
                payment_cycle VARCHAR(50),
                priority_listing BOOLEAN DEFAULT FALSE,      
                color_code VARCHAR(20),           
                badge_color VARCHAR(20),          
                features JSON,                              
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_tier_key (tier_key),
                INDEX idx_min_turnover (min_turnover),
                INDEX idx_is_active (is_active),
                INDEX idx_active_turnover (is_active, min_turnover),
                INDEX idx_tier_order (tier_order)
            );
        `
    },
    {
        name: "vendors",
        query:`
            CREATE TABLE IF NOT EXISTS vendors (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                vendor_code VARCHAR(20) UNIQUE,

                -- Basic Info
                business_name VARCHAR(150) NOT NULL,
                owner_name VARCHAR(150),
                email VARCHAR(150) UNIQUE,
                password VARCHAR(255),
                country_code VARCHAR(10),
                mobile VARCHAR(20),
                emergency_country_code VARCHAR(10),
                emergency_mobile VARCHAR(20),

                -- Categories (store category IDs)
                business_categories JSON,

                -- Tier
                tier_id BIGINT,
                commission_percent DECIMAL(5,2),
                total_turnover DECIMAL(12,2) DEFAULT 0,

                -- Address
                address TEXT,
                country VARCHAR(100),
                country_iso VARCHAR(10),
                state VARCHAR(100),
                state_iso VARCHAR(10),
                city VARCHAR(100),
                pincode VARCHAR(10),
                latitude VARCHAR(50),
                longitude VARCHAR(50),

                -- Personal & Business IDs
                aadhar_number VARCHAR(20),
                pan_number VARCHAR(20),
                license_number VARCHAR(50),
                fassi_code VARCHAR(50),
                gst_number VARCHAR(50),

                -- Bank
                bank_name VARCHAR(150),
                account_name VARCHAR(150),
                account_number VARCHAR(50),
                ifsc VARCHAR(20),

                -- System Fields
                profile_photo VARCHAR(255),
                is_verified BOOLEAN DEFAULT FALSE,
                status ENUM('Active','Inactive') DEFAULT 'Active',
                created_by BIGINT,
                last_login DATETIME,

                kyc_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
                kyc_reject_reason TEXT,
                kyc_verified_by BIGINT,
                kyc_verified_at DATETIME,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                FOREIGN KEY (tier_id) REFERENCES tiers(id),

                INDEX idx_email (email),
                INDEX idx_mobile (mobile),
                INDEX idx_vendor_code (vendor_code),
                INDEX idx_tier_id (tier_id),
                INDEX idx_status (status)
            );
        `
    },
    {
        name: "vendor_files",
        query: `
            CREATE TABLE IF NOT EXISTS vendor_files (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                vendor_id BIGINT,
                file_type VARCHAR(50),
                file_url VARCHAR(255),

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
                INDEX idx_vendor_id (vendor_id),
                INDEX idx_file_type (file_type)
            );
        `   
    }
];

const initDatabase = async () => {
  try {
    for (const table of TABLES) {
      const [rows] = await db.query(
        `SHOW TABLES LIKE '${table.name}'`
      );

      if (rows.length === 0) {
        await db.query(table.query);
        console.log(`Created table: ${table.name}`);
      } else {
        console.log(`Table already exists: ${table.name}`);
      }
    }

    console.log("Database initialization complete");
    process.exit(0);
  } catch (error) {
    console.error("Initialization failed:", error.message);
    process.exit(1);
  }
};

initDatabase();

