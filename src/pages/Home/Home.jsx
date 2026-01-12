import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGameConfig } from '../AgentPage/hooks/useGameConfig';

// Tuodaan alkuperäiset komponentit
import OriginalHero from '../../components/HeroSection/HeroSection.jsx';
import InfoSection from './InfoSection.jsx';
import Registration from './Registration.jsx';

// Tuodaan uusi komponentti tunnistetuille käyttäjille
import AccessView from './Access.jsx';

function Home() {
  // 1. Luetaan arvot suoraan localStoragesta
  const [ticketId, setTicketId] = useState(localStorage.getItem('jc_ticket_id'));
  const [username, setUsername] = useState(localStorage.getItem('jc_username'));
  
  // Lisätään tila, joka estää näkymän vaihtumisen ennen kuin tarkistus on valmis
  const [isReady, setIsReady] = useState(false);

  const { phase, phaseValue } = useGameConfig();
  const isRegistrationOpen = phaseValue < 1;

  useEffect(() => {
    const verifyIdentity = async () => {
      const storedId = localStorage.getItem('jc_ticket_id');
      
      // Jos ID:tä ei ole ollenkaan, ollaan heti valmiita näyttämään perussivu
      if (!storedId) {
        setIsReady(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('characters')
          .select('name, assigned_guest_id')
          .eq('assigned_guest_id', storedId)
          .maybeSingle();

        if (data && !error) {
          // Vahvistetaan tiedot
          setUsername(data.name);
          setTicketId(data.assigned_guest_id);
          localStorage.setItem('jc_username', data.name);
        } else if (error) {
          // Jos on oikea virhe, mutta meillä on jo nimi muistissa, pidetään se toistaiseksi
          console.error("Sentinel sync error, keeping local data.");
        } else if (!data) {
          // Vain jos kanta sanoo varmasti ettei ID:tä ole, nollataan tunnistus
          console.warn("Invalid ID detected.");
          setUsername(null);
          setTicketId(null);
        }
      } catch (err) {
        console.error("Verification failed:", err);
      } finally {
        // Nyt ollaan valmiita näyttämään lopullinen näkymä
        setIsReady(true);
      }
    };

    verifyIdentity();
  }, []);

  // Estetään renderöinti, kunnes olemme varmoja kumpaan näkymään mennään
  if (!isReady && ticketId) {
    return <div className="jc-wrapper" style={{ background: '#000' }} />;
  }

  // --- RENDERING LOGIC ---

  if (username) {
    return (
      <div className="jc-wrapper">
        <AccessView 
          username={username} 
          ticketId={ticketId} 
          phase={phase} 
          phaseValue={phaseValue}
        />
        <InfoSection phaseValue={phaseValue} />
      </div>
    );
  }

  return (
    <div className="jc-wrapper">
      <OriginalHero />
      <InfoSection phaseValue={phaseValue} />
      {isRegistrationOpen ? (
        <Registration />
      ) : (
        <section className="jc-card medium mb-4" style={{ textAlign: 'center', border: '1px solid #ff003c' }}>
          <h2 className="neon-text-red">ACCESS RESTRICTED</h2>
          <p>Vieraslista on lukittu. Rekisteröityminen on päättynyt.</p>
        </section>
      )}
    </div>
  );
}

export default Home;