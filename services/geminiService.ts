
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePowerUps(level: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The player just reached level ${level} in my game "SpellSlinger: Wizard with a Gun". Generate 3 unique "Arcane Weapon Modifiers" or "Spells" that act as power-ups. Each should have a funny or epic name and a brief mystical description.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            attributeAffected: { 
              type: Type.STRING, 
              enum: ['damage', 'fireRate', 'bulletSpeed', 'maxHealth', 'health']
            },
            multiplier: { type: Type.NUMBER }
          },
          required: ["name", "description", "attributeAffected", "multiplier"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [
      { name: "Mana Infusion", description: "Standard mana boost.", attributeAffected: "damage", multiplier: 1.2 },
      { name: "Swift Cast", description: "Trigger finger gets itchy.", attributeAffected: "fireRate", multiplier: 0.8 },
      { name: "Greater Stamina", description: "You feel bulkier.", attributeAffected: "maxHealth", multiplier: 1.2 }
    ];
  }
}

export async function generateDeathMessage(score: number, level: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `A wizard died in the game SpellSlinger. Score: ${score}, Level: ${level}. Write a short (1 sentence), sarcastic, or epic obituary from the perspective of a grumpy magic shop keeper.`,
  });
  return response.text || "You died. Pathetic.";
}
