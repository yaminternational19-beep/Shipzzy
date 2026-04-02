import db from "../config/db.js";

const TABLES = [
    {
        name: "customers",
        query: `
            CREATE TABLE IF NOT EXISTS customers (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                country_code VARCHAR(10),
                mobile VARCHAR(20),
                full_phone VARCHAR(20) UNIQUE,
                name VARCHAR(100),
                email VARCHAR(100),
                gender VARCHAR(20),
                profile_image VARCHAR(255),
                device_id VARCHAR(255),
                player_id VARCHAR(255),
                referral_code VARCHAR(50) UNIQUE,
                referrer_id BIGINT,
                login_type VARCHAR(20) DEFAULT 'otp',
                default_address_id BIGINT NULL,
                status ENUM('active', 'suspended', 'terminated') DEFAULT 'active',
                is_deleted BOOLEAN DEFAULT FALSE,
                last_login_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                google_id VARCHAR(100) NULL,
                apple_id VARCHAR(100) NULL,
                social_email VARCHAR(100) NULL,
                UNIQUE KEY unique_email (email),
                INDEX idx_full_phone (full_phone),
                INDEX idx_referrer_id (referrer_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (referrer_id) REFERENCES customers(id) ON DELETE SET NULL
            );
        `
    },
    {
        name: "customers_addresses",
        query: `
            CREATE TABLE IF NOT EXISTS customers_addresses (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                customer_id BIGINT,
                address_name VARCHAR(50),
                contact_person_name VARCHAR(100),
                contact_phone VARCHAR(20),
                address_line_1 VARCHAR(255),
                address_line_2 VARCHAR(255),
                landmark VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                country VARCHAR(100),
                latitude DECIMAL(10, 7),
                longitude DECIMAL(10, 7),
                is_default BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_customer_id (customer_id),
                INDEX idx_is_default (is_default),

                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );
        `
    },
    {
        name: "otp_verifications",
        query: `
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                phone VARCHAR(20),
                otp VARCHAR(10),
                token VARCHAR(500),
                expires_at DATETIME,
                attempts INT DEFAULT 0,
                send_count INT DEFAULT 1,
                last_sent_at DATETIME,
                verified BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                purpose ENUM('signup','login','forgot') DEFAULT 'login',
                UNIQUE KEY unique_token (token),
                INDEX idx_phone (phone),
                INDEX idx_token (token),
                INDEX idx_expires_at (expires_at)
            );
        `
    },
    {
        name: "customers_sessions",
        query: `
            CREATE TABLE IF NOT EXISTS customers_sessions (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                customer_id BIGINT,
                refresh_token TEXT,
                expires_at DATETIME,
                ip_address VARCHAR(50),
                user_agent VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                device_id VARCHAR(255),
                UNIQUE KEY unique_customer_device_session (customer_id, device_id),
                INDEX idx_customer_id (customer_id),
                INDEX idx_expires_at (expires_at),
                INDEX idx_device_id (device_id),
                INDEX idx_refresh_token (refresh_token(100)),
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );
        `
    },
    {
        name : "customers_devices",
        query: `
            CREATE TABLE IF NOT EXISTS customers_devices (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                customer_id BIGINT,
                device_id VARCHAR(255),
                player_id VARCHAR(255),
                device_type VARCHAR(50),
                app_version VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                last_login_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_customer_device (customer_id, device_id),
               
                INDEX idx_customer_id (customer_id),
                INDEX idx_player_id (player_id),
                INDEX idx_device_customer (customer_id, device_id),

                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
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