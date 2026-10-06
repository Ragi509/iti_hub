-- StoreSync Database Schema (PostgreSQL & SQLite compatible)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- Storekeeper, Instructor, Approver, Admin
  department VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  register_type VARCHAR(50) NOT NULL, -- bin, miscellaneous, dsr
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_stock REAL NOT NULL DEFAULT 0.0,
  price_per_unit REAL NOT NULL DEFAULT 0.0,
  department VARCHAR(100),
  location_code VARCHAR(100),
  dsr_code VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- purchase, issue, adjustment
  quantity REAL NOT NULL,
  date DATE NOT NULL,
  price REAL NOT NULL DEFAULT 0.0,
  department VARCHAR(100),
  remarks TEXT,
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS syllabus_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  required_quantity REAL NOT NULL,
  syllabus_reference VARCHAR(255),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS requisitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department VARCHAR(100) NOT NULL,
  requested_by VARCHAR(100) NOT NULL,
  job_or_practical VARCHAR(255) NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, issued, received
  approved_by VARCHAR(100),
  approved_at DATETIME,
  issued_by VARCHAR(100),
  issued_at DATETIME,
  received_confirmation_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requisition_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisition_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity_requested REAL NOT NULL,
  quantity_issued REAL NOT NULL DEFAULT 0,
  in_stock_flag INTEGER NOT NULL DEFAULT 1, -- 1 = true, 0 = false
  FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS distribution_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  department VARCHAR(100) NOT NULL,
  issued_date DATE NOT NULL,
  returned_date DATE,
  current_holder VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
