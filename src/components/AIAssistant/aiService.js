/**
 * aiService.js - Kommunikointi Netlifyn/Geminien kanssa
 */

export const generateAiContent = async (rawText, intent, charData) => {
  try {
    const response = await fetch('/.netlify/functions/formatMessageFromRaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rawText, 
        intent,
        // Lähetetään hahmon tiedot kontekstiksi
        customerState: {
          perustiedot: { 
            nimi: charData?.name, 
            hahmo: charData?.role || charData?.character_name 
          },
          hahmo_konteksti: {
            backstory: charData?.backstory,
            mission: charData?.secret_mission,
            is_avec: charData?.is_spouse_character
          }
        }
      })
    });

    if (!response.ok) throw new Error('AI-yhteys epäonnistui');
    
    const data = await response.json();
    return data.formattedMessage;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};