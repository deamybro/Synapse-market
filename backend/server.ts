import express from 'express';
import { WebSocketServer } from 'ws';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 3001;

// Circle API Client (Free on Testnet)
const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY || '',
  entitySecret: process.env.CIRCLE_ENTITY_SECRET || '',
});

// Arc Provider (Free via Canteen CLI)
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);

// Gemini AI Client (Free Tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const server = app.listen(PORT, () => console.log(`Agent Engine running on port ${PORT}`));
const wss = new WebSocketServer({ server });

async function getLLMReasoning(role: string) {
  try {
    const prompt = `You are a ${role} agent in the Synapse Market. Provide a very short, high-tech, bullish/bearish market thesis.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.warn(`[AI Warning] Failed to fetch LLM reasoning for ${role} agent. Using local consensus model. Error:`, error?.message || error);
    
    // Role-specific professional fallbacks so the system never crashes
    const fallbacks: Record<string, string> = {
      Macro: "Macro indicators suggest rate cuts will spark a risk-on wave. Accumulating highly liquid assets on Arc L1.",
      Geopolitical: "Geopolitical tensions are pricing in premium risk. Strategic capital shifts toward secure USD-backed assets.",
      Sentiment: "Social sentiment volume has hit extreme hype levels. Watching for momentum reversals in major liquidity pools.",
      Risk: "Volatility indices are crossing risk thresholds. Transitioning portfolio subsets into low-leveraged protective hedges.",
      Arbitrage: "Cross-chain price discrepancies detected. Initiating sub-second arbitrage settlement using USDC on Arc."
    };
    
    return fallbacks[role] || "Analyzing live orderbook signals on the Arc network.";
  }
}

setInterval(async () => {
  const roles = ['Macro', 'Geopolitical', 'Sentiment', 'Risk', 'Arbitrage'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  const reasoning = await getLLMReasoning(role);
  
  const payload = {
    id: Date.now().toString(),
    agentId: (Math.floor(Math.random() * 5) + 1).toString(),
    text: reasoning.trim(),
    timestamp: Date.now(),
  };

  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({ type: 'NEW_MESSAGE', payload }));
    }
  });
}, 10000);
