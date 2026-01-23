import React, { useEffect, useState, useRef } from 'react';

const NexusLines = ({ focalId, neighbors }) => {
  const [lines, setLines] = useState([]);
  const svgRef = useRef(null);

  const updateLines = () => {
    const focalCard = document.querySelector(`[data-character-id="${focalId}"]`);
    const svg = svgRef.current;
    if (!focalCard || !svg) return;

    const svgRect = svg.getBoundingClientRect();
    const fRect = focalCard.getBoundingClientRect();
    const fx = fRect.left - svgRect.left + fRect.width / 2;
    const fy = fRect.top - svgRect.top + fRect.height / 2;

    const newLines = neighbors.map(n => {
      const tCard = document.querySelector(`[data-character-id="${n.id}"]`);
      if (!tCard) return null;
      const tRect = tCard.getBoundingClientRect();
      return {
        id: n.id,
        x1: fx, y1: fy,
        x2: tRect.left - svgRect.left + tRect.width / 2,
        y2: tRect.top - svgRect.top + tRect.height / 2,
        type: n.relationType
      };
    }).filter(Boolean);

    setLines(newLines);
  };

  useEffect(() => {
    const timer = setTimeout(updateLines, 200);
    window.addEventListener('resize', updateLines);
    return () => { window.removeEventListener('resize', updateLines); clearTimeout(timer); };
  }, [focalId, neighbors]);

  return (
    <svg ref={svgRef} className="nexus-svg-layer">
      {lines.map(line => (
        <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={`nexus-line nexus-line-${line.type}`} />
      ))}
    </svg>
  );
};

export default NexusLines;