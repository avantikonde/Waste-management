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
      // Remove any surrounding quotes
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

console.log('🔌 Connecting to Neon PostgreSQL...')
const sql = neon(dbUrl)

async function initializeDatabase() {
  try {
    // 1. Users Table
    console.log('📦 Creating users table...')
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'citizen',
        ward VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 2. Reports Table
    console.log('📦 Creating reports table...')
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
        reporter_name VARCHAR(255),
        reporter_email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        green_points_awarded INT DEFAULT 50,
        assigned_driver VARCHAR(255),
        vehicle_number VARCHAR(64),
        estimated_clearance VARCHAR(64)
      );
    `

    // 3. Pickups Table
    console.log('📦 Creating pickups table...')
    await sql`
      CREATE TABLE IF NOT EXISTS pickups (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(128) NOT NULL,
        address VARCHAR(255) NOT NULL,
        date VARCHAR(64) NOT NULL,
        time_slot VARCHAR(64) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'Confirmed',
        quantity VARCHAR(64) NOT NULL DEFAULT '10-25 kg',
        instructions TEXT,
        driver_name VARCHAR(255),
        vehicle_number VARCHAR(64),
        eta_minutes INT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 4. Notifications Table
    console.log('📦 Creating notifications table...')
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        time VARCHAR(64) NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        type VARCHAR(64) NOT NULL DEFAULT 'info',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // 5. Driver Assignments Table
    console.log('📦 Creating driver_assignments table...')
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
        proof_image TEXT
      );
    `

    // 6. Rewards Table
    console.log('📦 Creating rewards table...')
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

    // 7. Check if reports table has data; if not, seed default Pune data
    const existingReports = await sql`SELECT count(*) FROM reports;`
    const count = parseInt(existingReports[0].count, 10)
    console.log(`📊 Current reports in database: ${count}`)

    if (count === 0) {
      console.log('🌱 Seeding initial Pune civic data...')
      const now = Date.now()

      await sql`
        INSERT INTO reports (id, type, category, location, address_details, lat, lng, status, priority, time, icon, description, reporter_name, reporter_email, created_at, green_points_awarded, assigned_driver, vehicle_number, estimated_clearance)
        VALUES
          ('CW-2026-008492', 'Plastic & packaging', 'Plastic & packaging', 'FC Road (near Deccan Gymkhana), Pune', 'Overflowing plastic bottles and takeout wrappers near bus stop', 18.5186, 73.8415, 'Submitted', 'High', 'Just now', 'PL', 'Overflowing single-use plastics near Deccan Gymkhana bus shelter', 'Citizen User', 'citizen@cleanconnect.in', ${new Date(now - 12 * 60 * 1000).toISOString()}, 50, NULL, NULL, 'Today, 2:30 PM'),
          ('CW-2026-008441', 'Organic & wet waste', 'Organic & wet waste', 'Shivajinagar Market Yard, Pune', 'Fruit peels and market compost overflowing onto pavement', 18.5314, 73.8446, 'Team on way', 'Critical', '45 min ago', 'OR', 'Vegetable and fruit bulk residue on curb', 'Ramesh Shinde', 'ramesh.s@pune.org', ${new Date(now - 45 * 60 * 1000).toISOString()}, 50, 'Suresh Jadhav', 'MH 12 AB 2840', 'Today, 1:45 PM'),
          ('CW-2026-008390', 'Construction debris', 'Construction debris', 'Kothrud, Paud Road (Near Vanaz), Pune', 'Broken tiles, loose cement sacks and masonry rubble obstructing corner', 18.5074, 73.8077, 'Submitted', 'High', '2 hours ago', 'CO', 'Leftover construction debris after footpath repairs', 'Pooja Kulkarni', 'pooja.k@gmail.com', ${new Date(now - 2 * 60 * 60 * 1000).toISOString()}, 50, NULL, NULL, 'Tomorrow, 10:00 AM'),
          ('CW-2026-008210', 'E-Waste / hazardous', 'E-Waste / hazardous', 'Koregaon Park North Main Rd, Pune', 'Discarded CRT monitors, wires and batteries left beside recycling bin', 18.5362, 73.8940, 'Resolved', 'Medium', 'Yesterday', 'EW', 'Safe recovery of circuit boards and battery pack completed', 'Amit Joshi', 'amit.j@pune.in', ${new Date(now - 24 * 60 * 60 * 1000).toISOString()}, 50, 'Nitin Pawar', 'MH 12 CD 9912', 'Cleared yesterday')
        ON CONFLICT (id) DO NOTHING;
      `
      console.log('✅ Pune reports seeded!')
    }

    // Check rewards table
    const existingRewards = await sql`SELECT count(*) FROM rewards;`
    if (parseInt(existingRewards[0].count, 10) === 0) {
      console.log('🌱 Seeding rewards...')
      await sql`
        INSERT INTO rewards (id, title, category, points_cost, icon, description, code, claimed)
        VALUES
          ('REW-01', 'Pune Metro Card Recharge Pass', 'Discount', 300, 'Train', 'Direct recharge voucher for Maha Metro Pune smart card or QR ticket.', 'PUNE-METRO-2026', false),
          ('REW-02', 'PMC 10% Property Tax Rebate Token', 'Voucher', 1000, 'Percent', 'Green citizen certificate qualifying your residential unit for 10% rebate.', 'PMC-TAX-REBATE-2026', false),
          ('REW-03', 'Home Composting Starter Kit', 'Product', 450, 'Package', 'Aerobic composter bin + 2kg cocopeat bio-culture for balcony organic waste.', 'COMPOST-PUNE-KIT', false),
          ('REW-04', 'Organic Farmers Market Voucher', 'Voucher', 200, 'ShoppingBag', 'Flat ₹150 off at weekly Pune Sunday Organic Bazaar in Model Colony.', 'ORGANIC-BAZAAR-150', false)
        ON CONFLICT (id) DO NOTHING;
      `
      console.log('✅ Rewards seeded!')
    }

    // Check pickups table
    const existingPickups = await sql`SELECT count(*) FROM pickups;`
    if (parseInt(existingPickups[0].count, 10) === 0) {
      console.log('🌱 Seeding initial pickups...')
      await sql`
        INSERT INTO pickups (id, type, address, date, time_slot, status, quantity, instructions, driver_name, vehicle_number, eta_minutes, lat, lng)
        VALUES
          ('PK-2026-004120', 'Society Segregated Waste (Wet & Dry)', 'Bluebell Heights, Viman Nagar, Pune', 'Tomorrow', '11:30 AM – 12:15 PM', 'Confirmed', '25-50 kg', 'Call security guard on gate #2 upon arrival.', 'Ravi K.', 'MH 12 AB 2840', 12, 18.5679, 73.9143),
          ('PK-2026-004098', 'Electronic & Battery Recycling Box', 'Plot 42, Model Colony, Shivajinagar, Pune', '06 Oct 2026', '03:00 PM – 04:00 PM', 'Confirmed', '< 10 kg', 'Left outside door in labeled green box.', 'Sunil T.', 'MH 12 CD 9912', NULL, 18.5332, 73.8370)
        ON CONFLICT (id) DO NOTHING;
      `
      console.log('✅ Pickups seeded!')
    }

    console.log('🎉 Neon PostgreSQL initialization and migration completed successfully!')
  } catch (err) {
    console.error('❌ Database initialization error:', err)
    process.exit(1)
  }
}

initializeDatabase()
