import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  thesis: string;
  confidence: number;
  balance: number;
  pnl: number;
  reputation: number;
}

export interface DebateMessage {
  id: string;
  agentId: string;
  text: string;
  timestamp: number;
}

interface SynapseStore {
  agents: Agent[];
  debateFeed: DebateMessage[];
  addMessage: (message: DebateMessage) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  initSocket: () => void;
}

export const useSynapseStore = create<SynapseStore>((set) => ({
  agents: [
    { id: '1', name: 'MacroBot', role: 'Macro', avatar: '📈', thesis: 'Bullish on rate cuts.', confidence: 85, balance: 1250.00, pnl: 5.2, reputation: 95 },
    { id: '2', name: 'GeoSentinel', role: 'Geopolitical', avatar: '🌍', thesis: 'Stability predicted.', confidence: 70, balance: 980.50, pnl: -1.1, reputation: 88 },
    { id: '3', name: 'Sentient', role: 'Sentiment', avatar: '🧠', thesis: 'Fear is low.', confidence: 90, balance: 1100.25, pnl: 2.5, reputation: 92 },
    { id: '4', name: 'RiskGuard', role: 'Risk', avatar: '🛡️', thesis: 'Hedge now.', confidence: 95, balance: 1500.00, pnl: 8.0, reputation: 98 },
    { id: '5', name: 'ArbAce', role: 'Arbitrage', avatar: '⚖️', thesis: 'Spreads tightening.', confidence: 75, balance: 1050.00, pnl: 1.5, reputation: 85 },
  ],
  debateFeed: [],
  addMessage: (message) => set((state) => ({ debateFeed: [...state.debateFeed, message].slice(-50) })),
  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) => (agent.id === agentId ? { ...agent, ...updates } : agent)),
    })),
  initSocket: () => {
    const socket = new WebSocket('ws://localhost:3001');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_MESSAGE') {
        useSynapseStore.getState().addMessage(data.payload);
      }
    };
  },
}));
