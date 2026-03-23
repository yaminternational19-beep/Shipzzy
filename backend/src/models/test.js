import pool from '../config/db.js';

const TABLES = [    
    {
        name: "test",
        query: `
            CREATE TABLE IF NOT EXISTS test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `
    }
];

const initDatabase = async () => {
    try {
        for (const table of TABLES) {
            await pool.query(table.query);
            console.log(`${table.name} table created`);
        }
        process.exit(0);
    } catch (error) {
        console.error("Initialization failed:", error.message);
        process.exit(1);
    }
};

initDatabase();