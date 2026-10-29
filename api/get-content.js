// Map any alternative connection strings to POSTGRES_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
if (connectionString && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = connectionString;
}

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    let result;
    try {
      // 1. Try to fetch configuration from database
      result = await sql`
        SELECT value FROM portfolio_config 
        WHERE key = 'content' 
        LIMIT 1;
      `;
    } catch (dbError) {
      // 2. If table doesn't exist, create it dynamically
      if (dbError.message.includes('relation "portfolio_config" does not exist') || dbError.code === '42P01') {
        console.log('[CMS Database] Table portfolio_config not found. Creating table...');
        
        await sql`
          CREATE TABLE IF NOT EXISTS portfolio_config (
            key VARCHAR(50) PRIMARY KEY,
            value TEXT NOT NULL
          );
        `;
        // Set result to empty to trigger seeding logic below
        result = { rows: [] };
      } else {
        // Re-throw other database issues
        throw dbError;
      }
    }

    // 3. If row is found, parse and return it
    if (result && result.rows && result.rows.length > 0) {
      const data = JSON.parse(result.rows[0].value);
      return res.status(200).json(data);
    }

    // 4. Seeding: If table is empty, read from local content.json and seed database
    console.log('[CMS Database] Database is empty. Seeding from local content.json...');
    const localPath = path.join(process.cwd(), 'content.json');
    const localRaw = fs.readFileSync(localPath, 'utf8');
    const localData = JSON.parse(localRaw);

    await sql`
      INSERT INTO portfolio_config (key, value) 
      VALUES ('content', ${JSON.stringify(localData)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;

    return res.status(200).json(localData);

  } catch (error) {
    console.error('[API Error] get-content failed:', error);
    
    // Fail-safe: if database is completely offline, return local content.json statically
    try {
      const localPath = path.join(process.cwd(), 'content.json');
      const localRaw = fs.readFileSync(localPath, 'utf8');
      const localData = JSON.parse(localRaw);
      return res.status(200).json(localData);
    } catch (fileError) {
      return res.status(500).json({ success: false, message: 'Internal server error reading config.' });
    }
  }
};
