module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { password } = req.body;

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
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    return res.status(200).json({ success: true, message: 'Authentication successful!' });

  } catch (error) {
    console.error('[API Error] verify-login failed:', error);
    return res.status(500).json({ success: false, message: 'Internal server error verifying password.' });
  }
};
