#!/bin/bash

# Tarkistetaan sijainti
if [ ! -d "src" ]; then
  echo "VIRHE: Aja tämä projektin juuressa (/Users/vesanessling/jc-jukka-club/)"
  exit 1
fi

echo "🚀 Päivitetään Anthero-komponentin tiedostot oikeilla koodeilla..."

# 1. Varmistetaan kansion olemassaolo
mkdir -p src/components/anthero

# 2. Kirjoitetaan AntheroBody.jsx (Vartalo)
echo "📝 Luodaan src/components/anthero/AntheroBody.jsx..."
cat <<EOF > src/components/anthero/AntheroBody.jsx
import React from 'react';

const AntheroBody = () => {
  return (
    <g id="anthero-body">
      {/* Tähden varjo/hohto */}
      <path 
        d="M100 10 L125 70 L190 70 L140 110 L160 170 L100 130 L40 170 L60 110 L10 70 L75 70 Z" 
        fill="none" 
        stroke="#FFA500" 
        strokeWidth="8" 
        opacity="0.3"
        filter="blur(4px)"
      />
      
      {/* Itse tähti */}
      <path 
        d="M100 10 L125 70 L190 70 L140 110 L160 170 L100 130 L40 170 L60 110 L10 70 L75 70 Z" 
        fill="#FFD700" 
        stroke="#FFA500" 
        strokeWidth="3" 
        strokeLinejoin="round"
      />
    </g>
  );
};

export default AntheroBody;
EOF

# 3. Kirjoitetaan AntheroFace.jsx (Kasvot ja ilmeet)
echo "📝 Luodaan src/components/anthero/AntheroFace.jsx..."
cat <<EOF > src/components/anthero/AntheroFace.jsx
import React from 'react';
import './Anthero.css';

const AntheroFace = ({ isSpeaking }) => {
  return (
    <g transform="translate(0, 10)">
      {/* --- SILMÄT --- */}
      <g className="anthero-eyes">
        <ellipse cx="75" cy="90" rx="8" ry="12" fill="#333" />
        <ellipse cx="125" cy="90" rx="8" ry="12" fill="#333" />
      </g>

      {/* --- SUU --- */}
      {isSpeaking ? (
        // Puhuva suu (CSS-animaatio hoitaa liikkeen)
        <ellipse 
          className="anthero-mouth-speaking"
          cx="100" 
          cy="120" 
          rx="10" 
          ry="8" 
          fill="#333"
        />
      ) : (
        // Hymy (Idle)
        <path 
          d="M85 120 Q100 135 115 120" 
          stroke="#333" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
        />
      )}
      
      {/* Kevyt viiksivarjo */}
      <path d="M90 110 L110 110" stroke="#333" strokeWidth="1" opacity="0.2" />
    </g>
  );
};

export default AntheroFace;
EOF

# 4. Kirjoitetaan SpeechBubble.jsx (Puhekupla)
echo "📝 Luodaan src/components/anthero/SpeechBubble.jsx..."
cat <<EOF > src/components/anthero/SpeechBubble.jsx
import React from 'react';
import './Anthero.css';

const SpeechBubble = ({ text, isVisible }) => {
  if (!isVisible || !text) return null;

  return (
    <div className="anthero-bubble-container">
      <div className="anthero-bubble">
        {text}
      </div>
    </div>
  );
};

export default SpeechBubble;
EOF

# 5. Kirjoitetaan Anthero.css (Tyylit ja animaatiot)
echo "📝 Luodaan src/components/anthero/Anthero.css..."
cat <<EOF > src/components/anthero/Anthero.css
/* Container */
.anthero-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 300px;
  margin: 0 auto;
}

/* Puhekupla */
.anthero-bubble-container {
  margin-bottom: 20px;
  min-height: 60px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.anthero-bubble {
  background-color: #222;
  color: #0f0; /* Neon vihreä */
  font-family: 'Courier New', Courier, monospace;
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #0f0;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  max-width: 100%;
  text-align: center;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Animaatiot */
@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Puhuva suu -animaatio */
.anthero-mouth-speaking {
  animation: talk 0.2s infinite alternate;
  transform-origin: center;
}

@keyframes talk {
  from { ry: 2px; }
  to { ry: 10px; }
}

/* Koko hahmon pieni kellunta (idle) */
.anthero-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
EOF

# 6. Kirjoitetaan index.jsx (Pääkomponentti)
echo "📝 Luodaan src/components/anthero/index.jsx..."
cat <<EOF > src/components/anthero/index.jsx
import React from 'react';
import AntheroBody from './AntheroBody';
import AntheroFace from './AntheroFace';
import SpeechBubble from './SpeechBubble';
import './Anthero.css';

const Anthero = ({ isSpeaking = false, text = "" }) => {
  return (
    <div className="anthero-wrapper">
      {/* Puhekupla */}
      <SpeechBubble text={text} isVisible={!!text} />

      {/* SVG Hahmo */}
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200" 
        className="anthero-float"
      >
        <AntheroBody />
        <AntheroFace isSpeaking={isSpeaking} />
      </svg>
    </div>
  );
};

export default Anthero;
EOF

echo "✅ Valmista! Anthero asennettu kansioon src/components/anthero/"