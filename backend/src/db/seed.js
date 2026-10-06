const path = require('path');
const fs = require('fs');
const db = require('../config/database');

async function seed() {
  console.log('Seeding StoreSync database...');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split schema SQL statements
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    // Replace SQLite specific syntax if using Postgres
    let sql = statement;
    if (db.isPostgres) {
      sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
               .replace(/DATETIME/g, 'TIMESTAMP');
    } else {
      sql = sql.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
               .replace(/TIMESTAMP/g, 'DATETIME');
    }
    await db.query(sql);
  }

  // Clear existing tables
  await db.query('DELETE FROM distribution_register;');
  await db.query('DELETE FROM requisition_items;');
  await db.query('DELETE FROM requisitions;');
  await db.query('DELETE FROM syllabus_requirements;');
  await db.query('DELETE FROM transactions;');
  await db.query('DELETE FROM items;');
  await db.query('DELETE FROM users;');

  console.log('Tables cleared. Inserting seed data...');

  // 1. Insert Users
  const users = [
    ['storekeeper', 'store123', 'Rajesh Sharma', 'Storekeeper', 'Main Store'],
    ['fitter_inst', 'inst123', 'Amit Kumar (Fitter)', 'Instructor', 'Fitter'],
    ['elec_inst', 'inst123', 'Suresh Patel (Electrician)', 'Instructor', 'Electrician'],
    ['weld_inst', 'inst123', 'Manoj Verma (Welder)', 'Instructor', 'Welder'],
    ['approver', 'app123', 'Dr. V. K. Singh (Vice-Principal)', 'Approver', 'Administration'],
    ['admin', 'admin123', 'System Administrator', 'Admin', 'IT Cell']
  ];

  for (const user of users) {
    await db.query(
      'INSERT INTO users (username, password, name, role, department) VALUES (?, ?, ?, ?, ?)',
      user
    );
  }

  // 2. Insert Items
  // items: name, register_type, category, unit, current_stock, price_per_unit, department, location_code, dsr_code
  const items = [
    // Bin Card items
    ['Mild Steel Flat Bar 50x6mm', 'bin', 'Raw Materials', 'Kg', 250, 65.50, 'Fitter', 'R-1 B-2', null],
    ['High Speed Steel Hacksaw Blades 12"', 'bin', 'Tools & Consumables', 'Pcs', 120, 45.00, 'Fitter', 'R-1 B-5', null],
    ['Insulated Combination Pliers 8"', 'bin', 'Hand Tools', 'Pcs', 45, 280.00, 'Electrician', 'R-2 B-1', null],
    ['Single Core Copper Cable 2.5 sq mm', 'bin', 'Electrical Wire', 'Meters', 500, 32.00, 'Electrician', 'R-3 B-4', null],
    ['M10 Hex Bolts & Nuts 50mm', 'bin', 'Fasteners', 'Boxes', 30, 150.00, 'Fitter', 'R-2 B-6', null],
    ['Welding Electrodes E6013 3.15mm', 'bin', 'Consumables', 'Boxes', 15, 420.00, 'Welder', 'R-4 B-1', null],

    // Miscellaneous items
    ['Emery Paper Grade 80/120', 'miscellaneous', 'Consumables', 'Sheets', 200, 12.00, 'Fitter', null, null],
    ['Cotton Waste Rags', 'miscellaneous', 'Safety & Cleaning', 'Kg', 50, 85.00, 'General', null, null],
    ['Soldering Flux Paste 100g', 'miscellaneous', 'Consumables', 'Tins', 25, 45.00, 'Electrician', null, null],
    ['Acetylene Gas Cylinder 7m3', 'miscellaneous', 'Consumables', 'Cylinders', 4, 1850.00, 'Welder', null, null],

    // Dead Stock Register (DSR) items
    ['Precision Bench Lathe Machine 1.5HP', 'dsr', 'Machinery', 'Pcs', 6, 125000.00, 'Fitter', 'Workshop Bay 1', 'ITI-DEL/REG-01/P-12/LOT-A/SR-101'],
    ['Digital Vernier Caliper 0-150mm', 'dsr', 'Measuring Instruments', 'Pcs', 15, 3400.00, 'Fitter', 'Cabinet C-2', 'ITI-DEL/REG-01/P-15/LOT-B/SR-205'],
    ['Portable Arc Welding Transformer 300A', 'dsr', 'Machinery', 'Pcs', 4, 38000.00, 'Welder', 'Welding Booth 3', 'ITI-DEL/REG-02/P-08/LOT-A/SR-301'],
    ['Digital Multimeter True RMS 1000V', 'dsr', 'Measuring Instruments', 'Pcs', 20, 2100.00, 'Electrician', 'Lab Shelf 4', 'ITI-DEL/REG-03/P-05/LOT-C/SR-408']
  ];

  const itemMap = {};
  for (const item of items) {
    const res = await db.query(
      `INSERT INTO items (name, register_type, category, unit, current_stock, price_per_unit, department, location_code, dsr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item
    );
    // Fetch last inserted item id
    const inserted = await db.get('SELECT id FROM items WHERE name = ?', [item[0]]);
    itemMap[item[0]] = inserted.id;
  }

  // 3. Insert Purchase Transactions for items (establishing stock batches)
  const transactions = [
    [itemMap['Mild Steel Flat Bar 50x6mm'], 'purchase', 300, '2026-07-01', 65.50, 'Fitter', 'Initial batch purchase invoice #INV-901', 'Storekeeper'],
    [itemMap['Mild Steel Flat Bar 50x6mm'], 'issue', 50, '2026-07-15', 65.50, 'Fitter', 'Issued for Module 1 Fitting Practical', 'Storekeeper'],
    [itemMap['High Speed Steel Hacksaw Blades 12"'], 'purchase', 150, '2026-07-02', 45.00, 'Fitter', 'Annual workshop stock purchase', 'Storekeeper'],
    [itemMap['High Speed Steel Hacksaw Blades 12"'], 'issue', 30, '2026-07-20', 45.00, 'Fitter', 'Issued to Fitter Batch A', 'Storekeeper'],
    [itemMap['Insulated Combination Pliers 8"'], 'purchase', 50, '2026-07-05', 280.00, 'Electrician', 'Tools procurement INV-442', 'Storekeeper'],
    [itemMap['Insulated Combination Pliers 8"'], 'issue', 5, '2026-07-25', 280.00, 'Electrician', 'Issued for Wire Joint Practical', 'Storekeeper'],
    [itemMap['Single Core Copper Cable 2.5 sq mm'], 'purchase', 600, '2026-07-10', 32.00, 'Electrician', 'Wiring roll bundle purchase', 'Storekeeper'],
    [itemMap['Single Core Copper Cable 2.5 sq mm'], 'issue', 100, '2026-07-28', 32.00, 'Electrician', 'House wiring assignment', 'Storekeeper'],
    [itemMap['M10 Hex Bolts & Nuts 50mm'], 'purchase', 30, '2026-07-12', 150.00, 'Fitter', 'Fasteners bulk box intake', 'Storekeeper'],
    [itemMap['Welding Electrodes E6013 3.15mm'], 'purchase', 20, '2026-07-14', 420.00, 'Welder', 'Electrode box intake INV-881', 'Storekeeper'],
    [itemMap['Welding Electrodes E6013 3.15mm'], 'issue', 5, '2026-07-29', 420.00, 'Welder', 'Lap joint welding test', 'Storekeeper'],
    [itemMap['Emery Paper Grade 80/120'], 'purchase', 200, '2026-07-15', 12.00, 'Fitter', 'Direct department requirement intake', 'Storekeeper'],
    [itemMap['Cotton Waste Rags'], 'purchase', 50, '2026-07-15', 85.00, 'General', 'General cleaning store intake', 'Storekeeper'],
    [itemMap['Soldering Flux Paste 100g'], 'purchase', 25, '2026-07-16', 45.00, 'Electrician', 'PCB Soldering kit intake', 'Storekeeper'],
    [itemMap['Acetylene Gas Cylinder 7m3'], 'purchase', 4, '2026-07-18', 1850.00, 'Welder', 'Gas refill cylinder receipt', 'Storekeeper']
  ];

  for (const tx of transactions) {
    await db.query(
      `INSERT INTO transactions (item_id, type, quantity, date, price, department, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      tx
    );
  }

  // 4. Insert Syllabus Requirements
  const syllabus = [
    ['Fitter', 'Mild Steel Flat Bar 50x6mm', 300, 'NCVT Fitter Module 2 Fitting Practical', 'Amit Kumar'],
    ['Fitter', 'High Speed Steel Hacksaw Blades 12"', 150, 'NCVT Fitter Job #4 Metal Cutting', 'Amit Kumar'],
    ['Fitter', 'M10 Hex Bolts & Nuts 50mm', 40, 'NCVT Fitter Assembly & Threading', 'Amit Kumar'],
    ['Electrician', 'Single Core Copper Cable 2.5 sq mm', 600, 'NCVT Electrician House Wiring Ex #3', 'Suresh Patel'],
    ['Electrician', 'Insulated Combination Pliers 8"', 40, 'NCVT Electrician Basic Tool Kit', 'Suresh Patel'],
    ['Electrician', 'Soldering Flux Paste 100g', 30, 'NCVT Electrician Jointing & Soldering', 'Suresh Patel'],
    ['Welder', 'Welding Electrodes E6013 3.15mm', 20, 'NCVT Welder SMAW Flat Position', 'Manoj Verma'],
    ['Welder', 'Acetylene Gas Cylinder 7m3', 5, 'NCVT Welder Oxy-Acetylene Cutting Practical', 'Manoj Verma']
  ];

  for (const s of syllabus) {
    await db.query(
      `INSERT INTO syllabus_requirements (department, item_name, required_quantity, syllabus_reference, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      s
    );
  }

  // 5. Insert Sample Requisition & Requisition Items
  const reqRes = await db.query(
    `INSERT INTO requisitions (department, requested_by, job_or_practical, student_count, status, approved_by, approved_at, issued_by, issued_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Fitter', 'Amit Kumar (Fitter)', 'Fitter Fitting Job #5 - Square Fit', 20, 'issued', 'Dr. V. K. Singh (Vice-Principal)', '2026-07-28 10:30:00', 'Rajesh Sharma', '2026-07-28 11:15:00']
  );

  const reqObj = await db.get('SELECT id FROM requisitions ORDER BY id DESC LIMIT 1');
  const reqId = reqObj.id;

  await db.query(
    `INSERT INTO requisition_items (requisition_id, item_id, quantity_requested, quantity_issued, in_stock_flag)
     VALUES (?, ?, ?, ?, ?)`,
    [reqId, itemMap['Mild Steel Flat Bar 50x6mm'], 20, 20, 1]
  );
  await db.query(
    `INSERT INTO requisition_items (requisition_id, item_id, quantity_requested, quantity_issued, in_stock_flag)
     VALUES (?, ?, ?, ?, ?)`,
    [reqId, itemMap['High Speed Steel Hacksaw Blades 12"'], 10, 10, 1]
  );

  // 6. Insert Distribution Register for DSR items
  const dsrDistributions = [
    [itemMap['Precision Bench Lathe Machine 1.5HP'], 'Fitter', '2026-06-10', null, 'Amit Kumar (Fitter Instruct.)', 'active', 'Installed in Lathe Section Bay 1'],
    [itemMap['Digital Vernier Caliper 0-150mm'], 'Fitter', '2026-07-01', null, 'Amit Kumar (Fitter Instruct.)', 'active', 'Issued for daily inspection lab'],
    [itemMap['Digital Multimeter True RMS 1000V'], 'Electrician', '2026-07-05', null, 'Suresh Patel (Elec Instruct.)', 'active', 'Issued to Electrical Lab Counter A'],
    [itemMap['Portable Arc Welding Transformer 300A'], 'Welder', '2026-06-15', null, 'Manoj Verma (Welder Instruct.)', 'active', 'Welding Booth 3 Transformer Unit']
  ];

  for (const dist of dsrDistributions) {
    await db.query(
      `INSERT INTO distribution_register (item_id, department, issued_date, returned_date, current_holder, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      dist
    );
  }

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seed().then(() => {
    console.log('Seeding finished.');
    process.exit(0);
  }).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = seed;
