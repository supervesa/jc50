import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function EmailViewer() {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndProcess = async () => {
      // 1. Luetaan parametrit URL-osoitteesta
      const templateId = searchParams.get('t'); // Template ID
      const name = searchParams.get('n') || 'Vieras'; // Nimi
      const character = searchParams.get('c') || 'Hahmo'; // Hahmo
      const ticketLink = searchParams.get('l') || '#'; // Lippulinkki

      if (!templateId) {
        setError("Viestiä ei voida näyttää: Template ID puuttuu.");
        setLoading(false);
        return;
      }

      try {
        // 2. Haetaan HTML-pohja tietokannasta
        const { data, error: dbError } = await supabase
          .from('email_templates')
          .select('body_html')
          .eq('id', templateId)
          .single();

        if (dbError || !data) throw new Error("Viestipohjaa ei löytynyt.");

        // 3. Suoritetaan placeholderien korvaus
        // Käytetään decodeURIComponent siltä varalta että URL:ssa on erikoismerkkejä
        const processedHtml = data.body_html
          .replace(/{{name}}/g, decodeURIComponent(name))
          .replace(/{{character}}/g, decodeURIComponent(character))
          .replace(/{{ticket_link}}/g, decodeURIComponent(ticketLink))
          // Poistetaan selainlinkki tästä näkymästä, ettei tule "inception"-efektiä
          .replace(/{{browser_link}}/g, '#');

        setContent(processedHtml);
      } catch (err) {
        console.error(err);
        setError("Viestin lataaminen epäonnistui.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcess();
  }, [searchParams]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>
      Ladataan viestiä...
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
      {error}
    </div>
  );

  // Renderöidään HTML-sisältö
  return (
    <div className="email-viewer-container">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}