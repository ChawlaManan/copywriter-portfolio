const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const password = req.method === 'POST' ? req.body?.password : req.query?.password;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 1. Password verification
    if (!adminPassword || adminPassword.trim() === '') {
      return res.status(500).json({ 
        success: false, 
        message: 'Admin password environment variable (ADMIN_PASSWORD) is not configured.' 
      });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    // 2. Check if Postgres is active
    if (!process.env.POSTGRES_URL) {
      return res.status(200).json({
        success: true,
        postgresActive: false,
        submissions: [],
        message: 'Postgres database is not connected. Inquiries are being forwarded directly to chawlamanan@outlook.com.'
      });
    }

    // 3. Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        project_type VARCHAR(100),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Fetch submissions
    const result = await sql`
      SELECT id, name, email, project_type, message, created_at
      FROM contact_submissions
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    return res.status(200).json({
      success: true,
      postgresActive: true,
      submissions: result.rows || []
    });

  } catch (error) {
    console.error('[API Error] get-submissions failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database query failed: ' + error.message
    });
  }
};
