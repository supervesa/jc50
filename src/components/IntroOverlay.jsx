import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, UserCheck, GlassWater, Activity, Lock, Wifi } from 'lucide-react';
import './IntroOverlay.css';

const IntroOverlay = ({ mode = 'ticket', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const content = {
    ticket: {
      color: '#D4AF37', // Plasma Gold
      steps: [
        { text: "HYVÄÄ ILTAA. TARKISTETAAN KUTSUA...", icon: <Sparkles size={24} /> },
        { text: "NIMENNE LÖYTYI LISTALTA, TERVETULOA!", icon: <ShieldCheck size={24} /> },
        { text: "JUKKA CLUB ODOTTAA TEITÄ. OLKAA HYVÄ.", icon: <GlassWater size={24} /> }
      ]
    },
    agent: {
      color: '#00ff41', // Matrix Green
      steps: [
        { text: "[SENTINEL] INITIALIZING ENCRYPTION PROTOCOLS...", icon: <Lock size={20} /> },
        { text: "[HQ] HANDSHAKE ESTABLISHED - PORT 8080.", icon: <Wifi size={20} /> },
        { text: "[DATA] DECRYPTING MISSION OBJECTIVES...", icon: <Activity size={20} /> },
        { text: "[ONLINE] SECURE CHANNEL OPEN. WELCOME, AGENT.", icon: <ShieldCheck size={20} /> }
      ]
    }
  };

  const currentMode = content[mode] || content.ticket;

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < currentMode.steps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 500); // Hieman rauhallisempi tahti

    const totalTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }, 2400); 

    return () => {
      clearInterval(stepInterval);
      clearTimeout(totalTimer);
    };
  }, [mode, onComplete, currentMode.steps.length]);

  return (
    <div className={`sentinel-intro-overlay mode-${mode} ${isFadingOut ? 'fade-out' : ''}`} style={{ '--theme-color': currentMode.color }}>
      
      {/* Skannausviiva näkyy VAIN agenttimoodissa */}
      {mode === 'agent' && <div className="scanner-line"></div>}
      
      <div className="noise-bg"></div>
      
      {/* Gatsby-henkinen Art Deco -taustakuvio TicketPagelle */}
      {mode === 'ticket' && <div className="art-deco-pattern"></div>}

      <div className="intro-content">
        <div className="intro-icon-wrapper">
          <div className="pulse-ring"></div>
          {currentMode.steps[currentStep].icon}
        </div>
        
        <div className="terminal-text-wrapper">
          <p className="terminal-text">
            {currentMode.steps[currentStep].text}
          </p>
        </div>

        <div className="system-status-bar">
          <div className={`status-segment ${currentStep >= 0 ? 'active' : ''}`}></div>
          <div className={`status-segment ${currentStep >= 1 ? 'active' : ''}`}></div>
          <div className={`status-segment ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`status-segment ${currentStep >= 3 ? 'active' : ''}`}></div>
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;