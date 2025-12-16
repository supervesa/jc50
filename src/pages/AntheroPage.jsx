import React, { useState, useEffect } from 'react';
import Anthero from '../components/anthero'; 


const AntheroPage = () => {
  const [text, setText] = useState("No päivää! Odotan ohjeita.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState(null);

  // 1. Äänen lataus
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const fiVoice = allVoices.find(v => v.lang.includes('fi')) || allVoices[0];
      setVoice(fiVoice);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 2. Puhefunktio
  const handleSpeak = (newText) => {
    window.speechSynthesis.cancel();
    setText(newText);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(newText);
    if (voice) utterance.voice = voice;
    utterance.lang = 'fi-FI';
    utterance.rate = 0.9; 
    utterance.pitch = 1.0; 

    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Taustaefektit CSS:stä (jc-haze) */}
      <div className="jc-haze"></div>

      {/* Pääalue (Hero) */}
      <div className="jc-hero">
        
        <div className="jc-wrapper">
          {/* Kortti, jossa lasiefekti (Glassmorphism) */}
          <div className="jc-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            
            {/* Otsikko Neon-tyylillä */}
            <h1 className="jc-h1">
              ANTHERO <span className="neon">LIVE</span>
            </h1>
            <p className="lead">
              Juhlien virallinen seremoniamestari.
            </p>

            {/* Anthero itse */}
            <div style={{ margin: '2rem 0', position: 'relative', zIndex: 10 }}>
              <Anthero isSpeaking={isSpeaking} text={text} />
            </div>

            {/* Kontrollit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <h2 className="jc-h2">PIKAKOMENNOT</h2>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="jc-cta primary"
                  onClick={() => handleSpeak("Tervetuloa juhliin! Minä olen Tero. Tähti, mutta en diiva.")}
                >
                  👋 Tervetuloa
                </button>
                
                <button 
                  className="jc-cta primary"
                  onClick={() => handleSpeak("Muistakaa ladata kuvia Live-seinälle! Se on tuolla ylävalikossa.")}
                >
                  📸 Live-seinä
                </button>

                <button 
                  className="jc-cta primary"
                  onClick={() => handleSpeak("Nyt on nälkä. Ruoka on valmista, olkaa hyvät.")}
                >
                  🍽️ Ruoka
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                 <button 
                  className="jc-cta ghost"
                  onClick={() => window.speechSynthesis.cancel()}
                  style={{ borderColor: '#ff0055', color: '#ff0055' }}
                >
                  🛑 HILJENNÄ HETI
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AntheroPage;