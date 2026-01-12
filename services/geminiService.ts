import { GoogleGenAI, Type } from "@google/genai";
import { RawSignal, Story, Sentiment, Urgency, SignalType, GlobalSettings, WebSource } from "../types";
import { formatStandardDate } from "./integrationService";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-pro-preview";

export const analyzeSignalsWithGemini = async (signals: RawSignal[], settings: GlobalSettings): Promise<Story[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    throw new Error("Gemini API Key is missing.");
  }

  const systemPrompt = `
    You are an expert Product Manager AI for the product "${settings.productName}".
    
    Product Context:
    ${settings.productDescription}
    
    Output strict JSON.
  `;

  const prompt = `
    Analyze the following list of raw signals (customer feedback, market news, internal notes).
    
    Your goal is to:
    1. Cluster related signals together into "Stories". 
    2. De-duplicate similar feedback (e.g., multiple people complaining about speed = 1 story).
    3. Identify the sentiment (Pain Point, Win, Threat, Neutral).
    4. Assess urgency (High, Medium, Low).
    5. Tag with Product Area and User Persona based on the Product Context provided.
    6. Count the signal strength (number of sources).
    
    Raw Signals Input:
    ${JSON.stringify(signals, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              narrative: { type: Type.STRING, description: "A concise, actionable headline for the story." },
              summary: { type: Type.STRING, description: "A 2-sentence summary of what is happening." },
              sentiment: { 
                type: Type.STRING, 
                enum: [Sentiment.PAIN_POINT, Sentiment.WIN, Sentiment.THREAT, Sentiment.NEUTRAL] 
              },
              urgency: {
                type: Type.STRING,
                enum: [Urgency.HIGH, Urgency.MEDIUM, Urgency.LOW]
              },
              productArea: { type: Type.STRING, description: "e.g., Performance, Pricing, UI/UX" },
              userPersona: { type: Type.STRING, description: "e.g., Admin, End User, Executive" },
              sourceIds: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of raw signal IDs that belong to this story."
              }
            },
            required: ["id", "narrative", "summary", "sentiment", "urgency", "productArea", "userPersona", "sourceIds"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    const stories: Story[] = JSON.parse(responseText);

    // Post-processing to calculate signal strength based on returned IDs
    return stories.map(story => ({
      ...story,
      signalStrength: story.sourceIds.length
    }));

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

// New function to parse arbitrary external JSON into RawSignal format
export const transformExternalDataToSignals = async (
  sourceName: string, 
  rawJsonData: any,
  settings: GlobalSettings,
  forcedType?: SignalType
): Promise<RawSignal[]> => {
  if (!process.env.API_KEY) {
     throw new Error("Gemini API Key is missing.");
  }

  const systemPrompt = `
    You are a data transformation agent for the product "${settings.productName}".
    
    Product Context:
    ${settings.productDescription}
    
    Convert arbitrary JSON into normalized RawSignal objects.
  `;

  const prompt = `
    I have retrieved raw data from an external integration: "${sourceName}".
    
    Your task is to parse this raw JSON data and transform it into a list of normalized "RawSignal" objects.
    
    Rules for transformation:
    1. Extract the core message or feedback content into the 'content' field. Use the Product Context to understand what part of the data is relevant content.
    2. Identify the date from the data. If date is missing, use "${formatStandardDate(new Date())}".
    3. Determine the 'type' (Internal, External, or Market).
    4. Extract author and source URL if available.
    5. Generate a unique ID for each signal.
    
    Raw Data:
    ${JSON.stringify(rawJsonData).substring(0, 20000)} 
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                enum: [SignalType.INTERNAL, SignalType.EXTERNAL, SignalType.MARKET]
              },
              date: { type: Type.STRING },
              author: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["id", "source", "content", "type", "date"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Gemini transformation");

    const signals: RawSignal[] = JSON.parse(responseText);

    // Enforce the forcedType if provided, and standardize date format
    return signals.map(s => {
      let formattedDate = s.date;
      try {
        const d = new Date(s.date);
        if (!isNaN(d.getTime())) {
          formattedDate = formatStandardDate(d);
        }
      } catch (e) { /* keep original if parse fail */ }

      return {
        ...s,
        type: forcedType || s.type,
        date: formattedDate
      };
    });

  } catch (error) {
    console.error("Gemini Transformation Failed:", error);
    throw error;
  }
};

// Function to process Web Sources using Google Search Grounding
export const processWebSource = async (
  source: WebSource,
  settings: GlobalSettings
): Promise<RawSignal[]> => {
  if (!process.env.API_KEY) throw new Error("Gemini API Key is missing.");

  const hasUrl = source.url && source.url.trim().length > 0;

  const systemPrompt = `
    You are an expert market researcher for the product "${settings.productName}".
    Context: ${settings.productDescription}
  `;

  const prompt = `
    Perform a Google Search to find recent information regarding the topic "${source.name}"${hasUrl ? ` specifically on the site or URL: "${source.url}"` : ''}.
    
    Look for:
    - Recent news, blog posts, or press releases.
    - Product updates, pricing changes, or feature launches.
    - Customer reviews or discussions.

    Filter the results to only include information RELEVANT to the product "${settings.productName}".
    
    Then, extract these findings into a list of normalized 'RawSignal' objects in JSON format.
    
    Rules:
    1. 'content': A summary of the specific finding.
    2. 'type': Use '${source.targetSignalType}'.
    3. 'source': Use the Source Name "${source.name}".
    4. 'url': Put the URL of the search result (from your grounding data) here.
    5. 'date': The date of the news/update. Defaults to "${formatStandardDate(new Date())}".
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                enum: [SignalType.INTERNAL, SignalType.EXTERNAL, SignalType.MARKET]
              },
              date: { type: Type.STRING },
              author: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["id", "source", "content", "type", "date"]
          }
        }
      }
    });

    // In search grounding, we should also check grounding metadata for URLs if the model didn't put them in the JSON
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Gemini Search");

    let signals: RawSignal[] = JSON.parse(responseText);

    // Enhancing signals with grounding URLs if they are missing or generic
    if (groundingChunks) {
        signals = signals.map((sig, index) => {
            // Attempt to find a relevant chunk, or just assign round-robin if ambiguous
            // This is a heuristic since the model should have done it, but fallback is good
            const relevantChunk = groundingChunks.find(c => c.web?.uri && (c.web.title?.includes(sig.source) || index === 0));
            // Prefer the model returned url, if not valid look for grounding chunk
            const finalUrl = sig.url && sig.url.length > 5 ? sig.url : (relevantChunk?.web?.uri || source.url);
            
            return {
                ...sig,
                url: finalUrl
            };
        });
    }

    return signals.map(s => ({
        ...s,
        id: crypto.randomUUID(), // Ensure unique ID
        type: source.targetSignalType // Enforce configured type
    }));

  } catch (error) {
    console.error("Gemini Web Source Processing Failed:", error);
    throw error;
  }
};