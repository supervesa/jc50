import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("VIRHE: GEMINI_API_KEY puuttuu .env-tiedostosta!");
            return;
        }

        // Testataan suoralla fetchillä v1-versiota
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("--- API VASTAUS ---");
        if (data.models) {
            console.log("Seuraavat mallit ovat käytettävissäsi:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (Tuki: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("Virhe listauksessa (tarkista API-avain):", data);
        }
    } catch (e) {
        console.error("Yhteysvirhe:", e);
    }
}

listModels();