import React, { useMemo } from 'react';
import './Constellation.css';

const getRandomPosition = (index) => {
  // Arvotaan paikka reunoilta, vältetään keskustaa (missä pääkuva on)
  const isLeft = Math.random() < 0.5;
  const x = isLeft ? Math.random() * 25 : 75 + Math.random() * 25; 
  const y = Math.random() * 90;
  const size = 60 + Math.random() * 60;
  const delay = Math.random() * 0.5;
  return { x, y, size, delay };
};

const ConstellationHistory = ({ history }) => {
  const nodes = useMemo(() => {
    // KORJAUS: Suodatetaan ensin pois ilmoitukset, joilla ei ole kuvaa
    return history
      .filter(post => post.image_url) 
      .map(post => ({ ...post, ...getRandomPosition() }));
  }, [history]);

  if (!nodes.length) return null;

  return (
    <div className="jc-constellation-container">
      <svg className="jc-constellation-lines">
        {nodes.map((node, i) => {
          if (i === nodes.length - 1) return null;
          const next = nodes[i + 1];
          return <line key={i} x1={`${node.x}%`} y1={`${node.y}%`} x2={`${next.x}%`} y2={`${next.y}%`} className="jc-line" />;
        })}
      </svg>
      {nodes.map((node, i) => (
        <div key={i} className="jc-star-node" style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.size}px`, height: `${node.size}px`, animationDelay: `${node.delay}s` }}>
          <img src={node.image_url} alt="" onError={(e)=>e.target.style.display='none'} />
        </div>
      ))}
    </div>
  );
};

export default ConstellationHistory;