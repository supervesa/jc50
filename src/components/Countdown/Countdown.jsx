import React, { useState, useEffect } from 'react';

function Countdown() {
  // Kohdepäivämäärä: 31.1.2026 klo 17:00
  const targetDate = new Date('2026-01-31T17:00:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      // Lasketaan aika
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Apufunktio: Lisää nolla eteen jos alle 10 (esim. 5 -> 05)
  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div className="jc-countdown">
      <div className="jc-count-item">
        <span className="jc-count-number">{timeLeft.days}</span>
        <span className="jc-count-label">Päivää</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number" style={{opacity:0.5}}>:</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number">{pad(timeLeft.hours)}</span>
        <span className="jc-count-label">Tuntia</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number" style={{opacity:0.5}}>:</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number">{pad(timeLeft.minutes)}</span>
        <span className="jc-count-label">Min</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number" style={{opacity:0.5}}>:</span>
      </div>
      <div className="jc-count-item">
        <span className="jc-count-number">{pad(timeLeft.seconds)}</span>
        <span className="jc-count-label">Sek</span>
      </div>
    </div>
  );
}

export default Countdown;