import pool from '../config/database.mjs';

const initDatabase = async () => {
  try {
    // Create auth_users table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cnic VARCHAR(255) NOT NULL,
        object_sell TEXT,
        agreement_to_sell_file VARCHAR(255),
        receipt_file VARCHAR(255),
        allotment_file VARCHAR(255),
        pay_for_transfer_file VARCHAR(255),
        auth_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default initDatabase; 