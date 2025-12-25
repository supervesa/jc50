import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
const juice = require('juice'); // <--- TÄMÄ ON SE UUSI TAIKA

const SAFETY_MODE = true; 
const ALLOWED_EMAILS = ['vesa.nessling@gmail.com', 'saikkonen.jukka@outlook.com'];

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    const { characterIds, subject, htmlTemplate, textTemplate, templateId } = JSON.parse(event.body);
    const optimizedHtml = juice(htmlTemplate);
    const { data: characters, error: fetchError } = await supabase
      .from('characters')
      .select('id, name, is_spouse_character, pre_assigned_email, assigned_guest_id, guests:assigned_guest_id(name, email, spouse_name)')
      .in('id', characterIds);

    if (fetchError) throw fetchError;

    const results = [];

    for (const char of characters) {
      // Supabase join voi palauttaa objektin tai taulukon
      const guestData = Array.isArray(char.guests) ? char.guests[0] : char.guests;
      
      const email = char.pre_assigned_email || guestData?.email;
      const targetEmail = email ? email.trim().toLowerCase() : null;

      if (!targetEmail || !char.assigned_guest_id) {
        results.push({ id: char.id, status: 'failed', error: 'Email tai Guest ID puuttuu' });
        continue;
      }

      if (SAFETY_MODE && !ALLOWED_EMAILS.includes(targetEmail)) {
        results.push({ id: char.id, status: 'skipped', email: targetEmail });
        continue;
      }

      // --- NIMEN RATKAISU ---
      let finalGuestName = guestData?.name || 'Vieras';
      if (char.is_spouse_character && guestData?.spouse_name) {
        finalGuestName = guestData.spouse_name;
      }

      const ticketLink = `https://jclub50.netlify.app/lippu/${char.assigned_guest_id}`;
      
      // --- SELAINLINKKI ---
      const baseUrl = "https://jclub50.netlify.app/viesti";
      const browserLink = `${baseUrl}?t=${templateId}&n=${encodeURIComponent(finalGuestName)}&c=${encodeURIComponent(char.name || '')}&l=${encodeURIComponent(ticketLink)}`;

      const pSubject = subject.replace(/{{character}}/g, char.name || '').replace(/{{name}}/g, finalGuestName);
      const pHtml = htmlTemplate
        .replace(/{{name}}/g, finalGuestName)
        .replace(/{{character}}/g, char.name || '')
        .replace(/{{ticket_link}}/g, ticketLink)
        .replace(/{{browser_link}}/g, browserLink);
        
      const pText = textTemplate
        .replace(/{{name}}/g, finalGuestName)
        .replace(/{{character}}/g, char.name || '')
        .replace(/{{ticket_link}}/g, ticketLink)
        .replace(/{{browser_link}}/g, browserLink);

      try {
        await transporter.sendMail({
          from: `"Jukka Club" <${process.env.GMAIL_USER}>`,
          to: targetEmail,
          subject: pSubject,
          html: pHtml,
          text: pText
        });

        // LOKITUS (Kuvakaappauksesi sarakkeet)
        await supabase.from('email_logs').insert({
          character_id: char.id,
          email_address: targetEmail,
          template_name: pSubject,
          status: 'sent'
        });

        results.push({ id: char.id, status: 'sent', email: targetEmail });
      } catch (sendError) {
        console.error("Gmail error:", sendError);
        await supabase.from('email_logs').insert({
          character_id: char.id,
          email_address: targetEmail,
          template_name: pSubject,
          status: 'failed',
          error_message: sendError.message
        });
        results.push({ id: char.id, status: 'failed', error: sendError.message });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Ajo suoritettu', results }),
    };
  } catch (err) {
    console.error("Kriittinen virhe:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};