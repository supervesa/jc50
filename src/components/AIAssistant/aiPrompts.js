/**
 * aiPrompts.js - J:CLUB 50 AI-logiikka ja ohjeistukset
 */

export const J_CLUB_LORE = `
Olet J:CLUB 50 -operaation viestintäupseeri (Vesa Nessling). 
Teema: Neon Gatsby (1920-luvun glamour yhdistettynä kyberpunk-estetiikkaan).
Tyyli: Salaperäinen, hienostunut, agenttihenkinen. Käytä termejä kuten 'protokolla', 'tiedonanto', 'agentti', 'verhottu'.
`;

export const getSystemInstruction = (intent, charData) => {
  let context = J_CLUB_LORE;

  if (charData) {
    context += `
Vastaanottaja on hahmo: ${charData.role || charData.character_name}.
Hahmon tausta: ${charData.backstory || charData.character_story}.
Salainen tehtävä: ${charData.secret_mission}.
`;
  }

  const prompts = {
    full_message: "Luo kokonainen kutsuviesti, joka sisältää H1-otsikon, H2-alaotsikon ja P-leipätekstin. Hyödynnä hahmon salaisuuksia hienovaraisesti.",
    instructions: "Luo selkeät mutta teeman mukaiset agenttiohjeet Agenttikommunikaattorin ja muiden järjestelmien käyttöön.",
    mystify: "Muuta annettu raakateksti erittäin mystiseksi ja vihjailevaksi agenttitiedonannoksi.",
    fix: "Korjaa annettu teksti kieliopillisesti ja muuta sävy Neon Gatsby -tyyliin sopivaksi."
  };

  return `${context}\nTEHTÄVÄ: ${prompts[intent] || prompts.full_message}`;
};