import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// --- ASETUKSET & TURVAMEKANISMI ---
const SAFETY_MODE = true; 
const ALLOWED_EMAILS = ['vesa.nessling@gmail.com', 'saikkonen.jukka@outlook.com', 'ilona.nessling@gmail.com'];

// Alustetaan Supabase (Service Role Key vaaditaan lokitukseen)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Alustetaan Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const handler = async (event) => {
  // Vain POST-kutsut sallitaan
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { characterIds, subject, htmlTemplate, textTemplate } = JSON.parse(event.body);

    if (!characterIds || characterIds.length === 0) {
      return { statusCode: 400, body: 'Vastaanottajia ei ole valittu.' };
    }

    // Haetaan hahmot ja niihin liitetyt vieraat yhdellä haulla
    const { data: characters, error: fetchError } = await supabase
      .from('characters')
      .select(`
        id, 
        name, 
        pre_assigned_email, 
        assigned_guest_id, 
        guests:assigned_guest_id ( name, email )
      `)
      .in('id', characterIds);

    if (fetchError) {
      console.error("Supabase haku epäonnistui:", fetchError.message);
      throw fetchError;
    }

    const results = [];

    // Käydään läpi valitut hahmot
    for (const char of characters) {
      const email = char.pre_assigned_email || char.guests?.email;
      const targetEmail = email ? email.trim().toLowerCase() : null;

      // Tarkistetaan että tarvittavat tiedot löytyvät
      if (!targetEmail || !char.assigned_guest_id) {
        results.push({ id: char.id, status: 'failed', error: 'Sähköposti tai vieras-linkitys puuttuu' });
        continue;
      }

      // Suodatus testivaiheessa (Safe Mode)
      if (SAFETY_MODE && !ALLOWED_EMAILS.includes(targetEmail)) {
        results.push({ id: char.id, status: 'skipped', email: targetEmail });
        continue;
      }

      // Luodaan linkki käyttäen Vieras-ID:tä
      const ticketLink = `https://jclub50.netlify.app/lippu/${char.assigned_guest_id}`;

      // Personoidaan sisältö (HTML, Teksti ja Aihe)
      const personalHtml = htmlTemplate
        .replace(/{{name}}/g, char.guests?.name || 'Vieras')
        .replace(/{{character}}/g, char.name || 'Hahmo')
        .replace(/{{ticket_link}}/g, ticketLink);

      const personalText = textTemplate
        .replace(/{{name}}/g, char.guests?.name || 'Vieras')
        .replace(/{{character}}/g, char.name || 'Hahmo')
        .replace(/{{ticket_link}}/g, ticketLink);

      const personalSubject = subject
        .replace(/{{character}}/g, char.name || 'Hahmo')
        .replace(/{{name}}/g, char.guests?.name || 'Vieras');

      try {
        // Lähetetään sähköposti (sisältää molemmat versiot)
        await transporter.sendMail({
          from: `"Jukka Club" <${process.env.GMAIL_USER}>`,
          to: targetEmail,
          subject: personalSubject,
          html: personalHtml,
          text: personalText
        });

        // Kirjataan onnistuminen email_logs -tauluun
        await supabase.from('email_logs').insert({
          character_id: char.id,
          email_address: targetEmail,
          template_name: personalSubject,
          status: 'sent'
        });

        results.push({ id: char.id, status: 'sent', email: targetEmail });

      } catch (sendError) {
        console.error(`Lähetysvirhe osoitteeseen ${targetEmail}:`, sendError.message);
        
        // Kirjataan virhe lokiin
        await supabase.from('email_logs').insert({
          character_id: char.id,
          email_address: targetEmail,
          template_name: personalSubject,
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
    console.error("Kriittinen virhe funktiossa:", err.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};