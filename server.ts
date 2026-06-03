import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Gemini setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Tools / Functions for Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: "add_opportunity",
        description: "Add a new sales opportunity to the pipeline.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["Order", "Rev"], description: "Category of the entry" },
            fy: { type: Type.STRING, description: "Fiscal Year (e.g. FY26)" },
            fyQtr: { type: Type.STRING, description: "FY Quarter (e.g. FY26Q3)" },
            salesPerson: { type: Type.STRING },
            itemName: { type: Type.STRING, description: "Name of the project or item" },
            customerName: { type: Type.STRING },
            sector: { type: Type.STRING },
            amountK: { type: Type.NUMBER, description: "Total amount in thousands (k)" },
            winRate: { type: Type.NUMBER, description: "Win probability from 0.0 to 1.0" },
            status: { type: Type.STRING, enum: ["Best", "Likely", "Worst"], description: "Forecast confidence level" },
          },
          required: ["category", "fy", "fyQtr", "salesPerson", "itemName", "customerName", "sector", "amountK", "winRate", "status"]
        }
      },
      {
        name: "update_opportunity",
        description: "Update an existing sales opportunity's core metrics or status.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The unique UUID of the opportunity" },
            updates: {
              type: Type.OBJECT,
              properties: {
                amountK: { type: Type.NUMBER, description: "Updated amount in thousands" },
                winRate: { type: Type.NUMBER, description: "Updated win rate (0.0 - 1.0)" },
                status: { type: Type.STRING, enum: ["Best", "Likely", "Worst"] },
                category: { type: Type.STRING, enum: ["Order", "Rev"] }
              }
            }
          },
          required: ["id", "updates"]
        }
      }
    ]
  }
];

// Helper function to check for transient, rate-limited, or overloaded state
function isTransientError(err: any): boolean {
  if (!err) return false;
  const errMsg = (err.message || String(err)).toLowerCase();
  
  // Direct checks on HTTP status code
  if (err.status === 503 || err.status === 500 || err.status === 429) {
    return true;
  }

  // Common transient keywords in messages
  if (
    errMsg.includes("503") ||
    errMsg.includes("500") ||
    errMsg.includes("429") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("high demand") ||
    errMsg.includes("temporary") ||
    errMsg.includes("temporary failure") ||
    errMsg.includes("quota") ||
    errMsg.includes("exhausted") ||
    errMsg.includes("rate limit") ||
    errMsg.includes("resource limit") ||
    errMsg.includes("overload") ||
    errMsg.includes("spike")
  ) {
    return true;
  }

  // Parse structured JSON errors if wrapped as string in message
  try {
    if (typeof err.message === 'string' && err.message.trim().startsWith('{')) {
      const parsed = JSON.parse(err.message);
      const code = parsed?.error?.code;
      const status = parsed?.error?.status;
      if (code === 503 || code === 429 || code === 500 || status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED') {
        return true;
      }
    }
  } catch (e) {
    // Ignore JSON parsing issues
  }

  return false;
}

// Helper to identify persistent daily quota limits that cannot be solved by instant retries
function isPersistentQuotaError(err: any): boolean {
  if (!err) return false;
  const errMsg = (err.message || String(err)).toLowerCase();

  if (
    errMsg.includes("free_tier_requests") || 
    errMsg.includes("limit: 20") || 
    errMsg.includes("daily limit") || 
    errMsg.includes("exceeded your current quota") ||
    errMsg.includes("resource_exhausted")
  ) {
    return true;
  }

  try {
    if (typeof err.message === 'string' && err.message.trim().startsWith('{')) {
      const parsed = JSON.parse(err.message);
      const status = parsed?.error?.status;
      const msg = parsed?.error?.message || '';
      if (status === 'RESOURCE_EXHAUSTED' || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("limit")) {
        return true;
      }
    }
  } catch (e) {
    // Ignore JSON parsing issues
  }

  return false;
}

// Helper function to call Gemini with robust retries, backoff, and model fallback
async function callGeminiChat(history: any[], message: string, systemInstruction: string, tools: any[]) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const retries = model === "gemini-3.5-flash" ? 3 : 2; // Extra retry for the primary model
    let delay = 1000;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Connecting to Intelligence Engine using ${model} (attempt ${attempt + 1})...`);
        const chat = ai.chats.create({
          model: model,
          config: {
            systemInstruction,
            tools,
          },
          history: history || []
        });

        const result = await chat.sendMessage({ message });
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt + 1} with model ${model} failed. Error:`, err.message || err);

        const isTransient = isTransientError(err);
        const isPersistentQuota = isPersistentQuotaError(err);

        if (isTransient && !isPersistentQuota && attempt < retries) {
          console.log(`Transient network/quota issue detected. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          // If not transient, is persistent quota, or we exhausted retries, fallback to next model immediately
          break;
        }
      }
    }
  }

  throw lastError;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, contextData } = req.body;

    // Summarize data safely for the AI, handling both arrays and custom objects
    let dataSummary: any = [];
    if (contextData) {
      if (Array.isArray(contextData)) {
        dataSummary = contextData.map((r: any) => ({
          id: r.id,
          item: r.itemName,
          customer: r.customerName,
          amount: r.amountK,
          status: r.status,
          owner: r.salesPerson,
          winRate: r.winRate
        })).slice(0, 100);
      } else if (contextData.sampleDeals && Array.isArray(contextData.sampleDeals)) {
        // Map sampleDeals subarray cleanly if passed as object
        dataSummary = {
          ...contextData,
          sampleDeals: contextData.sampleDeals.map((r: any) => ({
            id: r.id,
            item: r.itemName,
            customer: r.customerName,
            amount: r.amountK,
            status: r.status,
            owner: r.salesPerson,
            winRate: r.winRate
          }))
        };
      } else {
        dataSummary = contextData;
      }
    }

    const systemInstruction = `You are the "Strategic Forecasting Expert", an advanced AI assistant for sales pipeline intelligence.
        Your goal is to provide predictive insights, identify potential risks, and suggest optimization strategies based on pipeline data.
        
        Current Pipeline Context (Top 100 Records):
        ${JSON.stringify(dataSummary)}
        
        Capabilities:
        1. PREDICTIVE INSIGHTS: Analyze current "Potential" deals and "Win Rates" to forecast end-of-quarter landings. Use "Expected Value" (Amount * WinRate) for weighted forecasts.
        2. RISK IDENTIFICATION: Flag "at-risk" deals (e.g., high value but stagnant win rate or "Worst" status).
        3. OPTIMIZATION: Suggest resource allocation (e.g., "Assign Joe to help with the Microsoft deal") or strategy changes to hit quotas.
        4. EDIT/ADD: Manage records using the provided tools.
        
        Guidelines:
        - Be highly professional, concise, and decisive.
        - Use Markdown for responses (bolding, lists, etc.).
        - Business Logic: A "Committed" deal is defined as any opportunity with a win rate >= 75% (0.75). Refer to these as "Committed Pipeline".
        - If multiple deals match a search, ask WHICH one to update before calling the tool.
        - Always confirm when a tool is being called in your text response.`;

    const result = await callGeminiChat(history, message, systemInstruction, tools);
    
    res.json({
      text: result.text,
      functionCalls: result.functionCalls || null
    });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const errorMessage = error?.message || String(error);
    const isUnavailable = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand");
    
    res.status(500).json({ 
      error: isUnavailable 
        ? "The Intelligence Engine is currently experiencing high demand. Please try again in a few moments." 
        : "Intelligence Engine unavailable. Please check your system configuration." 
    });
  }
});

// Helper function to call Gemini with Response Schema for Forecasting
async function callGeminiForecast(promptMessage: string, schema: any) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const retries = model === "gemini-3.5-flash" ? 3 : 2; // Extra retry for primary model
    let delay = 1000;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Generating AI Forecast using ${model} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: promptMessage,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.65,
          }
        });

        if (!response.text) {
          throw new Error("Empty response received from Gemini.");
        }

        return JSON.parse(response.text.trim());
      } catch (err: any) {
        lastError = err;
        console.warn(`Forecast Attempt ${attempt + 1} with model ${model} failed. Error:`, err.message || err);

        const isTransient = isTransientError(err);
        const isPersistentQuota = isPersistentQuotaError(err);

        if (isTransient && !isPersistentQuota && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          // Fall back to next model immediately
          break;
        }
      }
    }
  }

  throw lastError;
}

const forecastResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A high-level narrative for the forecast forecast based on historical data and scenario trends." },
    overallConfidenceScore: { type: Type.INTEGER, description: "The overall confidence score of the forecast (between 0 and 100)." },
    overallConfidenceJustification: { type: Type.STRING, description: "Justification for the overall confidence score." },
    targetPeriod: { type: Type.STRING, description: "The period being forecasted, e.g., FY26Q3 or Q3." },
    baseForecastK: { type: Type.NUMBER, description: "The baseline forecast value in thousands of RMB based on current pipeline." },
    likelyForecastK: { type: Type.NUMBER, description: "The most likely forecasted realization in thousands of RMB." },
    bullishForecastK: { type: Type.NUMBER, description: "The bullish optimistic forecasted realization in thousands of RMB." },
    conservativeForecastK: { type: Type.NUMBER, description: "The conservative pessimistic forecasted realization in thousands of RMB." },
    categoryForecasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          categoryName: { type: Type.STRING, description: "Category of sales (e.g., 'Revenue' or 'Orders')." },
          forecastedValueK: { type: Type.NUMBER, description: "Forecasted sales amount in thousands of RMB." },
          confidenceScore: { type: Type.INTEGER, description: "Confidence score for this specific category (between 0 and 100)." },
          criticalDriver: { type: Type.STRING, description: "The primary historical or current driver for this classification." },
          comparisonTrend: { type: Type.STRING, description: "Comparison trend against the previous quarter, must be 'up', 'down', or 'flat'." }
        },
        required: ["categoryName", "forecastedValueK", "confidenceScore", "criticalDriver", "comparisonTrend"]
      }
    },
    sectorForecasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectorName: { type: Type.STRING },
          forecastedValueK: { type: Type.NUMBER },
          confidenceScore: { type: Type.INTEGER },
          growthTrend: { type: Type.STRING, description: "e.g., Rising, Flat, or Decelerating" }
        },
        required: ["sectorName", "forecastedValueK", "confidenceScore", "growthTrend"]
      }
    },
    keyTailwinds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of positive market, historical, or pipeline factors."
    },
    keyHeadwinds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of negative/risk market, historical, or pipeline factors."
    },
    highImpactRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING, description: "Name of the high-value deal to focus on." },
          customerName: { type: Type.STRING, description: "The customer's company name." },
          priority: { type: Type.STRING, description: "High, Medium, or Low" },
          actionableRecommendation: { type: Type.STRING, description: "Specific strategic action, e.g., 'Increase salesperson support', 'Address worst-status rating'." },
          potentialImpactK: { type: Type.NUMBER, description: "The financial impact in thousands of RMB of securing this deal." }
        },
        required: ["itemName", "customerName", "priority", "actionableRecommendation", "potentialImpactK"]
      }
    }
  },
  required: [
    "summary", 
    "overallConfidenceScore", 
    "overallConfidenceJustification", 
    "targetPeriod", 
    "baseForecastK", 
    "likelyForecastK", 
    "bullishForecastK", 
    "conservativeForecastK", 
    "categoryForecasts", 
    "sectorForecasts", 
    "keyTailwinds", 
    "keyHeadwinds", 
    "highImpactRecommendations"
  ]
};

app.post("/api/forecast", async (req, res) => {
  try {
    const { records, scenarioTrend } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid sales records provided." });
    }

    // Summarize critical stats for grounded prompting
    const totalRecords = records.length;
    const oldestDate = records.map(r => r.date).filter(Boolean).sort().shift() || "Unknown";
    const newestDate = records.map(r => r.date).filter(Boolean).sort().pop() || "Unknown";
    
    // Group totals by quarter/year to feed historical baseline
    const yearMetrics: Record<string, { totalK: number; count: number }> = {};
    const sectorMetrics: Record<string, { totalK: number; count: number; meanWinRate: number }> = {};
    const keyHighValueDeals: any[] = [];

    records.forEach(r => {
      // Fiscal period
      if (r.fy) {
        if (!yearMetrics[r.fy]) yearMetrics[r.fy] = { totalK: 0, count: 0 };
        yearMetrics[r.fy].totalK += r.amountK || 0;
        yearMetrics[r.fy].count += 1;
      }
      
      // Sector
      if (r.sector) {
        if (!sectorMetrics[r.sector]) sectorMetrics[r.sector] = { totalK: 0, count: 0, meanWinRate: 0 };
        sectorMetrics[r.sector].totalK += r.amountK || 0;
        sectorMetrics[r.sector].count += 1;
        sectorMetrics[r.sector].meanWinRate += r.winRate || 0;
      }

      // Large potential leads
      if (r.amountK >= 150 && (r.winRate < 1.0 && r.winRate > 0.05)) {
        keyHighValueDeals.push({
          itemName: r.itemName,
          customerName: r.customerName,
          sector: r.sector,
          amountK: r.amountK,
          winRate: r.winRate,
          salesPerson: r.salesPerson,
          status: r.status
        });
      }
    });

    // Finalize mean win rates
    Object.keys(sectorMetrics).forEach(k => {
      if (sectorMetrics[k].count > 0) {
        sectorMetrics[k].meanWinRate /= sectorMetrics[k].count;
      }
    });

    const targetPeriod = records.length > 0 ? [...new Set(records.map(r => r.fyQtr).filter(Boolean))].sort().pop() || "Current Qtr" : "FY26Q3";

    const dataSummaryPrompt = `
      You are an expert Enterprise AI Sales Forecasting engine. Your job is to automatically perform predictive calculations of enterprise sales pipeline, weighted expectations, and output a highly reliable multi-scenario forecast. This prediction must consider historical benchmarks, current deals, and selected macro conditions.
      
      Chosen Market Trend / Focus Scenario to model: "${scenarioTrend || "Standard Market Baseline"}"

      === CURRENT PIPELINE METRICS SUBMITTED ===
      - Total active/historical opportunities: ${totalRecords}
      - Date window boundaries: From ${oldestDate} to ${newestDate}
      
      - Volume Summary by Fiscal Period:
      ${JSON.stringify(yearMetrics)}
      
      - Volume & Historical Win-Rates by Sector:
      ${JSON.stringify(sectorMetrics)}
      
      - Top Pending Enterprise Opportunities for strategic recommendations (Securing these will alter the outcome):
      ${JSON.stringify(keyHighValueDeals.slice(0, 15))}
      
      === INSTRUCTIONS FOR SCIENTIFIC FORECASTING CALCULATION ===
      1. Baseline calculation (baseForecastK): Aggregate the weighted expected value (amountK * winRate) for all pipeline rows.
      2. Likely Forecast calculation (likelyForecastK): Adjust baseline based on the chosen scenario:
         - Standard Market: Apply neutral pipeline conversions and typical seasonal rates.
         - Bullish / Tech Expansion: Boost high-tech, SaaS and software sectors win probabilities by 15-20% and bump large enterprise deals.
         - Conservative / Fiscal Pullback: Trim pipeline win rates by 10-15%, especially those flagged with 'Worst' status or in traditional manufacturing/retail.
      3. Conservative forecast (conservativeForecastK): Generate a realistic downside value assuming severe macro friction or slippage.
      4. Bullish forecast (bullishForecastK): Generate an optimistic upside value assuming perfect cycle execution and high win-rate conversion.
      5. Provide an overall confidence score (0 to 100) and specific scores for Category and Sector breakdowns based on data coverage and historical volatility.
      6. Pinpoint actionable strategic recommendations matching real items in the top pending opportunities list.
      7. For each item in categoryForecasts, determine comparisonTrend ('up', 'down', or 'flat') comparing the current forecasted value with the previous quarter's corresponding metrics estimated from historical volume data.
      
      Generate a valid JSON matching the expected responseSchema exactly.
    `;

    const forecastData = await callGeminiForecast(dataSummaryPrompt, forecastResponseSchema);
    res.json(forecastData);
  } catch (error: any) {
    console.error("Forecasting Error:", error);
    res.status(500).json({ 
      error: error?.message || "Failed to generate predictive sales forecast. Please try again." 
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
