const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { password, data } = req.body;

    // 1. Check if ADMIN_PASSWORD environment variable is set
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.trim() === '') {
      return res.status(500).json({ 
        success: false, 
        message: 'Admin password environment variable (ADMIN_PASSWORD) is not configured on Vercel.' 
      });
    }

    // 2. Validate password
    if (password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid administration password.' });
    }

    // 3. Validate JSON payload
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid content data payload.' });
    }

    // 4. Update configuration in database
    await sql`
      INSERT INTO portfolio_config (key, value) 
      VALUES ('content', ${JSON.stringify(data)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;

    return res.status(200).json({ success: true, message: 'Portfolio configuration saved successfully!' });

  } catch (error) {
    console.error('[API Error] save-content failed:', error);
    return res.status(500).json({ success: false, message: 'Internal database error saving configuration.' });
  }
};
