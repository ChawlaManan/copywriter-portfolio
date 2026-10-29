const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // use body as is
      }
    }
    const { name, email, project_type, message, website } = body || {};

    // 2. Honeypot check for spam protection
    // Spambots will typically fill in all form inputs including hidden ones.
    if (website && website.trim().length > 0) {
      console.log('[Security Warning] Honeypot field triggered. Silently dropping submission.');
      return res.status(200).json({
        success: true,
        message: 'Inquiry delivered. Manan will review your requirements and reply in under 24 business hours.'
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

    const recipientEmail = 'chawlamanan@outlook.com';
    let emailDispatched = false;
    let dbSaved = false;

    // 5. Forward inquiry directly to Manan's email address via FormSubmit
    try {
      if (typeof fetch === 'function') {
        const emailRes = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            _replyto: email.trim(),
            _subject: `New Strategy Inquiry: ${name.trim()} (${project_type.trim()})`,
            'Client Name': name.trim(),
            'Work Email': email.trim(),
            'Project Requirement': project_type.trim(),
            'Project Description': message.trim(),
            _template: 'table',
            _captcha: 'false'
          })
        });
        if (emailRes.ok) {
          emailDispatched = true;
          console.log('[Email Dispatch] Inquiry successfully dispatched to inbox.');
        } else {
          console.warn('[Email Dispatch] FormSubmit returned status:', emailRes.status);
        }
      }
    } catch (mailError) {
      console.warn('[Email Dispatch Error]', mailError.message);
    }

    // 6. Database Archiving: If Postgres is configured on Vercel, record the inquiry
    if (process.env.POSTGRES_URL) {
      try {
        // Automatically ensure table exists
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

        await sql`
          INSERT INTO contact_submissions (name, email, project_type, message)
          VALUES (${name.trim()}, ${email.trim()}, ${project_type.trim()}, ${message.trim()});
        `;
        dbSaved = true;
        console.log('[Database] Inquiry stored in contact_submissions.');
      } catch (dbError) {
        console.warn('[Database Error] Failed to persist submission:', dbError.message);
      }
    }

    // 7. Return Success Response
    return res.status(200).json({
      success: true,
      message: 'Inquiry delivered. Manan will review your requirements and reply in under 24 business hours.'
    });

  } catch (error) {
    console.error('[API Error] Contact submission handler failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'We encountered an issue submitting your inquiry. Please send your details to chawlamanan@outlook.com directly.'
    });
  }
};
