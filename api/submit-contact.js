const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { name, email, project_type, message, website } = req.body;

    // 2. Honeypot check for spam protection
    // Spambots will typically fill in all form inputs including hidden ones.
    // If the hidden 'website' field has any content, we silently ignore it by returning success.
    if (website && website.trim().length > 0) {
      console.log('[Security Warning] Honeypot field triggered. Silently dropping submission.');
      return res.status(200).json({
        success: true,
        message: 'Success. Inquiry delivered. Manan will review your metrics and reply in under 24 business hours.'
      });
    }

    // 3. Validation - Required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is a required field.' });
    }
    if (!email || email.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Work email is a required field.' });
    }
    if (!project_type || project_type.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project requirement type must be selected.' });
    }
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project description is a required field.' });
    }

    // 4. Validation - Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid work email address.' });
    }

    // 5. Database Insertion using parameterized queries to protect against SQL injection
    // Fields: id, name, email, project_type, message, created_at (id & created_at are generated automatically)
    await sql`
      INSERT INTO contact_submissions (name, email, project_type, message)
      VALUES (${name.trim()}, ${email.trim()}, ${project_type.trim()}, ${message.trim()});
    `;

    // 6. Return Success Response
    return res.status(200).json({
      success: true,
      message: 'Success. Inquiry delivered. Manan will review your metrics and reply in under 24 business hours.'
    });

  } catch (error) {
    console.error('[API Error] Contact submission handler failed:', error);
    
    // Provide a friendly user-facing fallback message if database or environment variables are offline
    return res.status(500).json({
      success: false,
      message: 'We encountered a temporary database connection issue. Please send your details to chawlamanan@outlook.com directly.'
    });
  }
};
