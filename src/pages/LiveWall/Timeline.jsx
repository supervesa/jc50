import React from 'react';
import './Timeline.css';

const TimelineStrip = ({ history }) => {
  // Jos historia on tyhjä, ei näytetä mitään (tai tyhjä raita)
  if (!history || history.length === 0) return null;

  return (
    <div className="jc-timeline-container">
      {/* Koristeellinen taustaviiva */}
      <div className="jc-timeline-track-line"></div>

      <div className="jc-timeline-track">
        {history.map((post, index) => {
          // Määritellään onko tämä uusin (ensimmäinen listassa)
          const isLatest = index === 0;
          
          return (
            <div 
              key={post.id || index} 
              className={`jc-timeline-item ${isLatest ? 'latest' : ''}`}
            >
              <img 
                src={post.image_url} 
                alt="" 
                className="jc-timeline-img"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineStrip;