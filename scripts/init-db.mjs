import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

// Read DATABASE_URL from .env if not in process.env
let dbUrl = process.env.DATABASE_URL
if (!dbUrl && fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf8')
  for (const line of envText.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.slice('DATABASE_URL='.length).trim()
      if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
        dbUrl = dbUrl.slice(1, -1)
      }
      break
    }
  }
}

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found in environment or .env file.')
  process.exit(1)
}

function getLocalDateString(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

console.log('🔌 Connecting to Neon PostgreSQL...')
const sql = neon(dbUrl)

async function initializeDatabase() {
  try {
    // 1. Users Table
    console.log('📦 Ensuring users table & columns...')
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) DEFAULT 'password123',
        role VARCHAR(32) NOT NULL DEFAULT 'Citizen',
        ward VARCHAR(128),
        city VARCHAR(128) DEFAULT 'Pune',
        green_points INT DEFAULT 1240,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'password123';`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(128) DEFAULT 'Pune';`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS green_points INT DEFAULT 1240;`

    // 2. Reports Table
    console.log('📦 Ensuring reports table & columns...')
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(128) NOT NULL,
        category VARCHAR(128) NOT NULL,
        location VARCHAR(255) NOT NULL,
        address_details TEXT,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'Submitted',
        priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
        time VARCHAR(64),
        icon VARCHAR(16),
        description TEXT,
        image TEXT,
        proof_image TEXT,
        reporter_name VARCHAR(255),
        reporter_email VARCHAR(255),
        citizen_phone VARCHAR(64),
        reporter_phone VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        green_points_awarded INT DEFAULT 50,
        assigned_driver VARCHAR(255),
        vehicle_number VARCHAR(64),
        driver_phone VARCHAR(64),
        estimated_clearance VARCHAR(64)
      );
    `
    await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
    await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS citizen_phone VARCHAR(64);`
    await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_phone VARCHAR(64);`
    await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS proof_image TEXT;`

    // 3. Pickups Table
    console.log('📦 Ensuring pickups table & columns...')
    await sql`
      CREATE TABLE IF NOT EXISTS pickups (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(128) NOT NULL,
        address VARCHAR(255) NOT NULL,
        contact VARCHAR(64),
        date VARCHAR(64) NOT NULL,
        time_slot VARCHAR(64) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'Accepted',
        quantity VARCHAR(64) NOT NULL DEFAULT '10-25 kg',
        instructions TEXT,
        driver_name VARCHAR(255),
        vehicle_number VARCHAR(64),
        driver_phone VARCHAR(64),
        availability_slot_id VARCHAR(64),
        eta_minutes INT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS contact VARCHAR(64);`
    await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
    await sql`ALTER TABLE pickups ADD COLUMN IF NOT EXISTS availability_slot_id VARCHAR(64);`

    // 4. Notifications Table
    console.log('📦 Ensuring notifications table...')
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        time VARCHAR(64) NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        type VARCHAR(64) NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 5. Driver Assignments Table
    console.log('📦 Ensuring driver_assignments table & columns...')
    await sql`
      CREATE TABLE IF NOT EXISTS driver_assignments (
        id VARCHAR(64) PRIMARY KEY,
        report_id VARCHAR(64) NOT NULL,
        type VARCHAR(128) NOT NULL,
        location VARCHAR(255) NOT NULL,
        priority VARCHAR(32) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'New',
        time_slot VARCHAR(64) NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        distance_km DOUBLE PRECISION,
        proof_image TEXT,
        driver_name VARCHAR(255),
        driver_phone VARCHAR(64),
        vehicle_number VARCHAR(64),
        citizen_phone VARCHAR(64),
        report_image TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);`
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);`
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(64);`
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS citizen_phone VARCHAR(64);`
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS report_image TEXT;`
    await sql`ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`

    // 6. Driver Availability Table
    console.log('📦 Ensuring driver_availability table...')
    await sql`
      CREATE TABLE IF NOT EXISTS driver_availability (
        id VARCHAR(64) PRIMARY KEY,
        driver_id VARCHAR(64) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        driver_phone VARCHAR(64) NOT NULL,
        vehicle_number VARCHAR(64) NOT NULL,
        vehicle_type VARCHAR(128) NOT NULL,
        date VARCHAR(64) NOT NULL,
        time_slot VARCHAR(64) NOT NULL,
        location VARCHAR(255) NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        booked_by_pickup_id VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 7. Driver Profile Table
    console.log('📦 Ensuring driver_profile table...')
    await sql`
      CREATE TABLE IF NOT EXISTS driver_profile (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        vehicle_number VARCHAR(64) NOT NULL,
        vehicle_type VARCHAR(128) NOT NULL,
        zone VARCHAR(255) NOT NULL,
        depot VARCHAR(255) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'On Duty',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 8. Rewards Table
    console.log('📦 Ensuring rewards table...')
    await sql`
      CREATE TABLE IF NOT EXISTS rewards (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        points_cost INT NOT NULL,
        icon VARCHAR(64),
        description TEXT,
        code VARCHAR(64),
        claimed BOOLEAN DEFAULT FALSE
      );
    `

    // 9. Clean up old broken v1 seed rows and refresh seed data with current timestamps
    console.log('🧹 Cleaning up outdated seed rows and refreshing timestamps...')
    await sql`
      DELETE FROM reports
      WHERE id IN ('CW-2026-008492', 'CW-2026-008441', 'CW-2026-008390', 'CW-2026-008210');
    `
    await sql`
      DELETE FROM pickups
      WHERE id IN ('PK-2026-004098');
    `

    const now = Date.now()
    const today = getLocalDateString(0)
    const tomorrow = getLocalDateString(1)
    const dayAfter = getLocalDateString(2)

    await sql`
      INSERT INTO reports (
        id, type, category, location, address_details, lat, lng,
        status, priority, time, icon, description,
        reporter_name, reporter_email, citizen_phone, reporter_phone,
        created_at, green_points_awarded,
        assigned_driver, vehicle_number, driver_phone, estimated_clearance
      ) VALUES
        ('CW-2026-009102', 'Mixed waste', 'Mixed waste', 'FC Road, Near Goodluck Cafe, Pune', 'Commercial sidewalk corner near restaurant strip', 18.5186, 73.8415, 'Assigned', 'High', '18 min ago', 'MW', 'Unsorted commercial boxes and domestic plastic accumulated near pedestrian crossing.', 'Rohan Patil', 'rohan.patil@cleanconnect.pune', '+91 98220 88711', '+91 98220 88711', ${new Date(now - 18 * 60 * 1000).toISOString()}, 50, 'Ravi Kumar', 'MH 12 AB 2840', '+91 98220 44123', 'Within 30 mins'),
        ('CW-2026-009088', 'Plastic & packaging', 'Plastic & packaging', 'Viman Nagar, Datta Mandir Chowk, Pune', 'Near Phoenix Marketcity service road', 18.5679, 73.9143, 'Team on way', 'Medium', '45 min ago', 'PP', 'Single-use packaging, plastic bottles, and snack wrappers left near park pathway.', 'Avantika Kumar', 'avantika.k@pune-clean.gov.in', '+91 98220 33419', '+91 98220 33419', ${new Date(now - 45 * 60 * 1000).toISOString()}, 50, 'Ravi Kumar', 'MH 12 AB 2840', '+91 98220 44123', '15 mins'),
        ('CW-2026-009065', 'Overflowing Bin', 'Mixed waste', 'Koregaon Park, Lane 5, Pune', 'Opposite Osho Garden entrance', 18.5362, 73.8940, 'Submitted', 'High', '2 hrs ago', 'OB', 'Public bin at capacity; roadside spillage onto jogging lane. Rapid clearance requested.', 'Pooja Kulkarni', 'pooja.k@cleanconnect.pune', '+91 98224 77102', '+91 98224 77102', ${new Date(now - 2 * 3600 * 1000).toISOString()}, 50, 'Amit Deshmukh', 'MH 12 GH 9034', '+91 98229 11984', 'Within 45 mins'),
        ('CW-2026-009071', 'Construction debris', 'Construction debris', 'Kothrud, Near Karve Statue, Pune', 'Near Mayur Colony main road', 18.5074, 73.8077, 'Resolved', 'Critical', 'Yesterday', 'CD', 'Broken concrete slabs and demolition plaster obstructing residential entry. Cleared by PMC Heavy Squad.', 'Suresh Shinde', 'suresh.s@cleanconnect.pune', '+91 98221 90112', '+91 98221 90112', ${new Date(now - 22 * 3600 * 1000).toISOString()}, 100, 'Nitin Pawar', 'MH 12 EF 7721', '+91 98224 88712', 'Cleared & Verified'),
        ('CW-2026-009054', 'Organic waste', 'Organic waste', 'Shivajinagar, Modern College Chowk, Pune', 'Fresh produce transit point', 18.5308, 73.8474, 'Resolved', 'Medium', '2 days ago', 'OW', 'Vegetable leaves and organic wet waste diverted directly to PMC bio-methanation plant.', 'Rohan Patil', 'rohan.patil@cleanconnect.pune', '+91 98220 88711', '+91 98220 88711', ${new Date(now - 46 * 3600 * 1000).toISOString()}, 50, 'Suresh Patil', 'MH 12 CD 3912', '+91 98221 55678', 'Cleared & Verified')
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        created_at = EXCLUDED.created_at,
        assigned_driver = EXCLUDED.assigned_driver,
        vehicle_number = EXCLUDED.vehicle_number,
        driver_phone = EXCLUDED.driver_phone,
        citizen_phone = EXCLUDED.citizen_phone,
        reporter_phone = EXCLUDED.reporter_phone,
        estimated_clearance = EXCLUDED.estimated_clearance;
    `

    await sql`
      INSERT INTO pickups (
        id, type, address, contact, date, time_slot, status, quantity,
        instructions, driver_name, vehicle_number, driver_phone, eta_minutes, lat, lng, created_at
      ) VALUES (
        'PK-2026-004120', 'Society / apartment waste', 'Bluebell Heights, Near Symbiosis, Viman Nagar, Pune',
        '+91 98220 12345', ${today}, '10:00 AM – 12:00 PM', 'En route', '25–50 kg',
        'Gate 2 security will guide driver to basement segregated collection room.',
        'Ravi Kumar', 'MH 12 AB 2840', '+91 98220 44123', 14, 18.5679, 73.9143,
        ${new Date(now - 35 * 60 * 1000).toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        date = EXCLUDED.date,
        time_slot = EXCLUDED.time_slot,
        contact = EXCLUDED.contact,
        driver_name = EXCLUDED.driver_name,
        vehicle_number = EXCLUDED.vehicle_number,
        driver_phone = EXCLUDED.driver_phone,
        created_at = EXCLUDED.created_at;
    `

    await sql`
      INSERT INTO driver_availability (
        id, driver_id, driver_name, driver_phone, vehicle_number, vehicle_type,
        date, time_slot, location, lat, lng, is_booked, created_at
      ) VALUES
        ('SLOT-DRV-01', 'DRV-P1', 'Ravi Kumar', '+91 98220 44123', 'MH 12 AB 2840', 'Electric Tipper Truck (2.5T)', ${today}, '10:00 AM – 12:00 PM', 'FC Road & Shivajinagar, Pune', 18.5204, 73.8567, false, NOW()),
        ('SLOT-DRV-02', 'DRV-P1', 'Ravi Kumar', '+91 98220 44123', 'MH 12 AB 2840', 'Electric Tipper Truck (2.5T)', ${today}, '02:00 – 04:00 PM', 'FC Road & Shivajinagar, Pune', 18.5204, 73.8567, false, NOW()),
        ('SLOT-DRV-03', 'DRV-P2', 'Suresh Patil', '+91 98221 55678', 'MH 12 CD 3912', 'Electric Tipper Truck (2.5T)', ${today}, '04:00 – 06:00 PM', 'Kothrud & Karve Nagar, Pune', 18.5074, 73.8077, false, NOW()),
        ('SLOT-DRV-04', 'DRV-P1', 'Ravi Kumar', '+91 98220 44123', 'MH 12 AB 2840', 'Electric Tipper Truck (2.5T)', ${tomorrow}, '08:00 – 10:00 AM', 'FC Road & Shivajinagar, Pune', 18.5204, 73.8567, false, NOW()),
        ('SLOT-DRV-05', 'DRV-P3', 'Nitin Pawar', '+91 98224 88712', 'MH 12 EF 7721', 'Heavy Compactor Truck (6T)', ${tomorrow}, '10:00 AM – 12:00 PM', 'Kothrud & Karve Nagar, Pune', 18.5074, 73.8077, false, NOW()),
        ('SLOT-DRV-06', 'DRV-P4', 'Amit Deshmukh', '+91 98229 11984', 'MH 12 GH 9034', 'Electric Tipper Truck (2.5T)', ${dayAfter}, '08:00 – 10:00 AM', 'Viman Nagar, Pune', 18.5679, 73.9143, false, NOW())
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        time_slot = EXCLUDED.time_slot,
        is_booked = false;
    `

    await sql`
      INSERT INTO rewards (id, title, category, points_cost, icon, description, code, claimed)
      VALUES
        ('REW-01', 'Pune Metro Card Recharge Pass', 'Discount', 300, 'Train', 'Direct recharge voucher for Maha Metro Pune smart card or QR ticket.', 'PUNE-METRO-2026', false),
        ('REW-02', 'Home Composting Starter Kit', 'Eco Gear', 600, 'Package', 'Aerobic composting drum with 2 kg bio-culture mix delivered to your doorstep.', 'COMPOST-HERO-KIT', false),
        ('REW-03', 'PMC Civic Property Tax Rebate Token', 'Rebate', 1000, 'Award', 'City municipal rebate certificate valid for property tax assessment.', 'PMC-CIVIC-HERO-26', false),
        ('REW-04', 'Native Sapling Planted in Your Name', 'Tree Planting', 400, 'TreePine', 'Urban forestry partner plants a geo-tagged Neem or Peepal tree in Pune green belt.', 'TREE-PUNE-7749', false)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        points_cost = EXCLUDED.points_cost,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        code = EXCLUDED.code;
    `

    console.log('🎉 Neon PostgreSQL schema migration & timing refresh completed successfully!')
  } catch (err) {
    console.error('❌ Database initialization error:', err)
    process.exit(1)
  }
}

initializeDatabase()
