
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData, Page, Character } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Develops a seed idea into a massive, content-rich, professional-grade screenplay.
 * Focuses on cinematic detail and natural progression to ensure 100+ distinct visual beats.
 */
export async function developStoryConcept(idea: string): Promise<{ story: string; screenplay: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `You are a world-class cinematic director and screenwriter. 
    TASK:
    1. Expand the SEED IDEA into a massive, content-rich narrative summary.
    2. Write an EXHAUSTIVE, MASSIVE SCREENPLAY (minimum 3000 words). 
       CRITICAL INSTRUCTION: You must provide enough granular detail for at least 100 distinct visual panels. 
       Focus heavily on "In-Between" moments. Describe micro-actions, shifts in environment, and precise character positions. 
       Ensure every single second of the story is accounted for to create a perfectly fluid cinematic flow. 
       The story must have complex emotional weight but be written with clear, simple actions that a storyboard artist can visualize easily.
    
    SEED IDEA:
    ${idea}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING, description: "The narrative summary." },
          screenplay: { type: Type.STRING, description: "The exhaustive, massive, beat-by-beat professional screenplay." },
        },
        required: ["story", "screenplay"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

/**
 * Groups screenplay into high-density storyboard pages.
 * Enforces a minimum of 10 pages, each with exactly 10 panels.
 */
export async function generateStoryboardFromText(text: string): Promise<StoryboardData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `You are a professional manga storyboard artist for a major film studio.
    TASK:
    1. CHARACTER DESIGN: Define characters with EXTREME SIMPLICITY. Use "Mannequins" or "Silhouetted figures" with one distinguishing feature (e.g., "Mannequin with a glowing visor", "Silhouette with a long coat"). No facial features. 
    2. PRODUCTION SCALE: Break the provided screenplay into a MINIMUM of 10 PAGES.
    3. STRICT STRUCTURAL RULE: Each PAGE MUST contain EXACTLY 10 sequential SCENES (panels). No more, no less. This means you will generate 100+ panels in total.
    4. LAYOUT: Provide a "pageLayoutDescription" for a standard technical 10-panel grid for each page.
    
    TEXT:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                appearance: { type: Type.STRING, description: "Minimalist character description." },
              },
              required: ["id", "name", "appearance"],
            },
          },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                pageNumber: { type: Type.INTEGER },
                pageLayoutDescription: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      sceneNumber: { type: Type.INTEGER },
                      location: { type: Type.STRING },
                      action: { type: Type.STRING },
                      dialogue: { type: Type.STRING },
                      visualPrompt: { type: Type.STRING },
                    },
                    required: ["id", "sceneNumber", "location", "action", "visualPrompt"],
                  },
                },
              },
              required: ["id", "pageNumber", "scenes", "pageLayoutDescription"],
            },
          },
        },
        required: ["title", "characters", "pages"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

/**
 * Generates a standard-sized manga page image containing a 10-panel grid.
 */
export async function generatePageImage(
  page: Page, 
  allCharacters: Character[]
): Promise<string> {
  const characterContext = allCharacters
    .map(c => `${c.name}: ${c.appearance}`)
    .join(". ");

  const scenesPrompts = page.scenes
    .map(s => `Panel ${s.sceneNumber}: ${s.visualPrompt}. Location: ${s.location}`)
    .join(". ");
    
  const fullPrompt = `Professional Cinematic Storyboard Page. 
  Vertical Page Layout (3:4 Ratio). 
  Layout: A technical grid of 10 panels. 
  Characters: ${characterContext} (Simplified mannequins, focus on anatomy and blocking). 
  Content: ${scenesPrompts}. 
  Visual Style: Industrial black and white ink sketch on bright white paper. Rough pencil texture. No shades of gray, just stark black and white. High contrast. 
  Directorial Instructions: Emphasize CAMERA ANGLES (low angle, wide shot, close up) and DEPTH OF FIELD. This is a technical blueprint for a 10-panel sequence.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: fullPrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4", 
      }
    }
  });

  let imageUrl = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Failed to generate technical sketch.");
  return imageUrl;
}
