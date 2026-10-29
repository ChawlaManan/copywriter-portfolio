// Map any alternative connection strings to POSTGRES_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
if (connectionString && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = connectionString;
}

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
    let needsActivation = false;
    let activationMessage = '';
    let dbSaved = false;

    // 5. Database Archiving: Store in Postgres for the CMS
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
        console.log('[CMS Database] Inquiry successfully recorded in contact_submissions.');
      } catch (dbError) {
        console.warn('[CMS Database Warning] Failed to persist submission:', dbError.message);
      }
    }

    // 6. Support Resend API if configured in Vercel environment variables
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Portfolio Inquiry <onboarding@resend.dev>',
            to: recipientEmail,
            reply_to: email.trim(),
            subject: `New Strategy Inquiry: ${name.trim()} (${project_type.trim()})`,
            html: `
              <h2>New Portfolio Strategy Inquiry</h2>
              <p><strong>Client Name:</strong> ${name.trim()}</p>
              <p><strong>Work Email:</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p>
              <p><strong>Requirement:</strong> ${project_type.trim()}</p>
              <p><strong>Scope & Metrics Needed:</strong></p>
              <blockquote style="background: #f4f4f4; padding: 12px; border-left: 3px solid #1c1c1c; font-family: sans-serif; white-space: pre-wrap;">${message.trim()}</blockquote>
            `
          })
        });
        if (resendRes.ok) {
          emailDispatched = true;
          console.log('[Email Dispatch] Successfully sent via Resend API.');
        }
      } catch (resendErr) {
        console.warn('[Resend API Error]', resendErr.message);
      }
    }

    // 7. Forward inquiry to Manan's email address via FormSubmit (if not sent via Resend)
    if (!emailDispatched) {
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
            const emailData = await emailRes.json();
            if (emailData.success === 'true' || emailData.success === true) {
              emailDispatched = true;
              console.log('[Email Dispatch] Inquiry successfully dispatched to inbox.');
            } else if (emailData.message && (emailData.message.toLowerCase().includes('confirm') || emailData.message.toLowerCase().includes('activat'))) {
              needsActivation = true;
              activationMessage = emailData.message;
            }
          }
        }
      } catch (mailError) {
        console.warn('[Email Dispatch Error]', mailError.message);
      }
    }

    // 8. Return Response
    if (needsActivation && !dbSaved) {
      return res.status(200).json({
        success: true,
        dbSaved: false,
        requiresActivation: true,
        message: 'Action Required: FormSubmit sent a one-time activation link to chawlamanan@outlook.com. Please check your Outlook Junk/Spam folder and click "Activate Form" once to start receiving all client inquiries.',
        inquiry: {
          name: name.trim(),
          email: email.trim(),
          project_type: project_type.trim(),
          message: message.trim(),
          created_at: new Date().toISOString()
        }
      });
    }

    return res.status(200).json({
      success: true,
      dbSaved: dbSaved,
      message: 'Inquiry delivered. Manan will review your requirements and reply in under 24 business hours.',
      inquiry: {
        name: name.trim(),
        email: email.trim(),
        project_type: project_type.trim(),
        message: message.trim(),
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[API Error] Contact submission handler failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'We encountered an issue submitting your inquiry. Please send your details to chawlamanan@outlook.com directly.'
    });
  }
};
