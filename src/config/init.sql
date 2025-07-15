-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  cnic VARCHAR(13) NOT NULL UNIQUE,
  status ENUM('active', 'blocked') DEFAULT 'active',
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_email (email),
  UNIQUE INDEX idx_cnic (cnic)
);

-- Создание таблицы недвижимости
CREATE TABLE IF NOT EXISTS properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  floor VARCHAR(50) NOT NULL,
  current_owner_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (current_owner_id) REFERENCES users(id),
  INDEX idx_current_owner (current_owner_id)
);

-- Создание таблицы истории владения
CREATE TABLE IF NOT EXISTS ownership_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  owner_id INT NOT NULL,
  from_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  to_date TIMESTAMP NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_property (property_id),
  INDEX idx_owner (owner_id)
);

-- Создание таблицы сделок
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  property_id INT NOT NULL,
  previous_owner_id INT NOT NULL,
  new_owner_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (previous_owner_id) REFERENCES users(id),
  FOREIGN KEY (new_owner_id) REFERENCES users(id),
  INDEX idx_property (property_id),
  INDEX idx_previous_owner (previous_owner_id),
  INDEX idx_new_owner (new_owner_id),
  INDEX idx_status (status)
);

-- Создание таблицы документов сделок
CREATE TABLE IF NOT EXISTS transaction_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('contract', 'id_proof', 'payment_proof') NOT NULL,
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  INDEX idx_transaction (transaction_id)
);

-- Создание администратора по умолчанию
INSERT INTO users (name, email, password, cnic, role)
VALUES (
  'Admin',
  'admin@doctorheights.pk',
  '$2a$10$your_hashed_password',
  '0000000000000',
  'admin'
)
ON DUPLICATE KEY UPDATE id=id; 