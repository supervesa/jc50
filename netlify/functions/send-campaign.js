// netlify/functions/send-campaign.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// --- CONFIG ---
const SAFETY_MODE = true; // Vain sallitut osoitteet
const ALLOWED_EMAILS = ['vesa.nessling@gmail.com', 'saikkonen.jukka@outlook.com'];

// Supabase alustus
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Nodemailer alustus (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { characterIds, subject, htmlTemplate } = JSON.parse(event.body);

    if (!characterIds || characterIds.length === 0) {
      return { statusCode: 400, body: 'No recipients selected' };
    }

    // Haetaan hahmot ja niihin liitetyt vieraat
    const { data: characters, error: fetchError } = await supabase
      .from('characters')
      .select('id, name, pre_assigned_email, assigned_guest_id, guests:assigned_guest_id(name, email)')
      .in('id', characterIds);

    if (fetchError) throw fetchError;

    const results = [];

    // Käydään läpi jokainen hahmo
    for (const char of characters) {
      // 1. Ratkaistaan mihin osoitteeseen lähetetään
      const email = char.pre_assigned_email || char.guests?.email;
      const targetEmail = email ? email.trim().toLowerCase() : null;

      // Jos ei ole näyttelijää tai sähköpostia, ei voida lähettää
      if (!targetEmail || !char.assigned_guest_id) {
        results.push({ id: char.id, status: 'failed', error: 'Email or Guest assignment missing' });
        continue;
      }

      // 2. Safe Mode tarkistus
      if (SAFETY_MODE && !ALLOWED_EMAILS.includes(targetEmail)) {
        console.log(`Safety Mode BLOCKED: ${targetEmail}`);
        results.push({ id: char.id, status: 'skipped', email: targetEmail });
        continue;
      }

      // 3. Rakennetaan linkki käyttämällä VIERAS-ID:tä (char.assigned_guest_id)
      const ticketLink = `https://jclub50.netlify.app/lippu/${char.assigned_guest_id}`;

      // 4. Personoidaan HTML-sisältö
      const personalHtml = htmlTemplate
        .replace(/{{name}}/g, char.guests?.name || 'Vieras')
        .replace(/{{character}}/g, char.name || 'Hahmo')
        .replace(/{{ticket_link}}/g, ticketLink);

      // 5. Lähetys Gmaililla
      try {
        const info = await transporter.sendMail({
          from: `"Jukka Club" <${process.env.GMAIL_USER}>`,
          to: targetEmail,
          subject: subject,
          html: personalHtml,
        });

        console.log(`Email sent to ${targetEmail}: ${info.messageId}`);
        results.push({ id: char.id, status: 'sent', email: targetEmail });

      } catch (sendError) {
        console.error("Gmail send failed", sendError);
        results.push({ id: char.id, status: 'failed', error: sendError.message });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Batch complete', results }),
    };

  } catch (err) {
    console.error('Critical function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};