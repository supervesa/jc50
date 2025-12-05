import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const COLORS = {
  NODE: '#00E7FF',      // Oletus: Turkoosi
  SELECTED: '#FFFFFF',  // Valittu: Valkoinen
  LINK_DEFAULT: '#444', // Linkki: Tummanharmaa
  LINK_LOVE: '#FF00E5', // Rakkaus: Magenta
  LINK_WAR: '#FF2A2A'   // Konflikti: Punainen
};

function NetworkGraph({ nodes, links, onSelectNode, selectedNodeId, zoomLevel }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null); // Viite zoomattavaan ryhmään <g>

  // Apufunktio: Asettaa zoomin (transform) suoraan DOM-elementtiin
  const applyZoom = (selection, width, height, k) => {
    if (!selection) return;
    // Lasketaan keskipiste-zoom
    const tx = (width / 2) - (width / 2) * k;
    const ty = (height / 2) - (height / 2) * k;
    selection.attr("transform", `translate(${tx},${ty}) scale(${k})`);
  };

  // --- 1. SIMULAATIO JA PIIRTO ---
  useEffect(() => {
    // Varmistetaan että DOM-elementti on olemassa
    if (!svgRef.current) return;

    // Haetaan elementin todellinen koko
    const { width, height } = svgRef.current.getBoundingClientRect();
    
    // Jos kokoa ei ole (esim. piilotettu), keskeytetään
    if (width === 0 || height === 0) return;

    // 1. Tyhjennetään vanha sisältö (Resetti)
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 2. Luodaan uusi container-ryhmä, jota zoomataan
    const container = svg.append("g");
    containerRef.current = container;

    // Asetetaan heti oikea zoom-taso (ettei hypi)
    applyZoom(container, width, height, zoomLevel);

    // 3. Kopioidaan data (TÄRKEÄÄ: D3 muokkaa objekteja, emme halua sotkea Reactin tilaa)
    const simulationNodes = nodes.map(d => ({ ...d }));
    const simulationLinks = links.map(d => ({ ...d }));

    // 4. Käynnistetään fysiikkasimulaatio
    const simulation = d3.forceSimulation(simulationNodes)
      .force("link", d3.forceLink(simulationLinks).id(d => d.id).distance(100)) // Linkin pituus
      .force("charge", d3.forceManyBody().strength(-300)) // Hylkimisvoima
      .force("center", d3.forceCenter(width / 2, height / 2)) // Vedetään keskelle
      .force("collide", d3.forceCollide().radius(35)); // Estetään päällekkäisyys

    // 5. Piirretään Viivat (Links)
    const link = container.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke", d => {
        const desc = d.label ? d.label.toLowerCase() : "";
        if (desc.match(/rakas|vaimo|mies|avec|pari/)) return COLORS.LINK_LOVE;
        if (desc.match(/viha|vihollinen|velka/)) return COLORS.LINK_WAR;
        return COLORS.LINK_DEFAULT;
      });

    // 6. Piirretään Pallot (Nodes) - Ryhmä joka sisältää pallon ja tekstin
    const node = container.append("g")
      .selectAll("g")
      .data(simulationNodes)
      .join("g")
      .call(d3.drag() // Raahaus-logiikka
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Lisätään ympyrä
    node.append("circle")
      .attr("r", d => d.id === selectedNodeId ? 16 : 10) // Valittu on isompi
      .attr("fill", d => d.id === selectedNodeId ? COLORS.SELECTED : COLORS.NODE)
      .attr("stroke", "#fff")
      .attr("stroke-width", d => d.id === selectedNodeId ? 3 : 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        // Estetään klikkauksen leviäminen
        event.stopPropagation();
        onSelectNode(d);
      });

    // Lisätään teksti (Nimi)
    node.append("text")
      .text(d => d.name ? d.name.split(' ')[0] : '?') // Vain etunimi
      .attr("x", 14)
      .attr("y", 4)
      .attr("fill", "#fff")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("font-weight", "bold")
      .style("pointer-events", "none") // Hiiri menee tekstin läpi
      .style("text-shadow", "0 1px 4px #000");

    // 7. Päivitys joka "tick" (animaatio)
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // --- Drag Functions ---
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup: Pysäytä simulaatio kun komponentti poistuu
    return () => simulation.stop();

  }, [nodes, links, selectedNodeId, onSelectNode]); // Huom: zoomLevel ei ole tässä listassa!

  
  // --- 2. ZOOMAUKSEN PÄIVITYS ---
  // Tämä ajaa vain, kun slideria liikutetaan (erittäin nopea)
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    const { width, height } = svgRef.current.getBoundingClientRect();
    applyZoom(containerRef.current, width, height, zoomLevel);
  }, [zoomLevel]);

  return (
    <svg 
      ref={svgRef} 
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }} 
    />
  );
}

export default NetworkGraph;