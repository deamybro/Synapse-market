import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarDescription: string;
  accent: string;
  thesis: string;
  premiumThesis: string;
  confidence: number;
  balance: number;
  pnl: number;
  reputation: number;
  revenue: number;
}

export interface DebateMessage {
  id: string;
  agentId: string;
  text: string;
  timestamp: number;
  kind?: 'reasoning' | 'payment' | 'execution' | 'system';
}

export interface PaymentEvent {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  amount: number;
  reason: string;
  timestamp: number;
}

export interface ExecutionEvent {
  id: string;
  status: 'watching' | 'consensus' | 'executing' | 'settled';
  signal: 'BULLISH' | 'BEARISH' | 'HEDGE' | 'ARBITRAGE';
  amount: number;
  participants: string[];
  timestamp: number;
}

interface SynapseStore {
  agents: Agent[];
  debateFeed: DebateMessage[];
  payments: PaymentEvent[];
  execution: ExecutionEvent;
  selectedAgentId: string;
  unlockedPremium: Record<string, boolean>;
  connectionStatus: 'connecting' | 'live' | 'simulated' | 'offline';
  addMessage: (message: DebateMessage) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  selectAgent: (agentId: string) => void;
  triggerMarketEvent: () => void;
  unlockPremiumThesis: (agentId: string) => void;
  initSocket: () => void;
}

const initialAgents: Agent[] = [
  {
    id: '1',
    name: 'Macro Agent',
    role: 'Macro',
    avatar: 'MA',
    avatarDescription: 'Chrome analyst mask with a green yield-curve visor',
    accent: '#00ff9d',
    thesis: 'Rate-cut probability is rising; risk assets can reprice higher.',
    premiumThesis: 'Premium thesis: 2Y yields are softening faster than equity vol implies. Accumulate liquid beta while hedging the first move after CPI.',
    confidence: 84,
    balance: 1250.0,
    pnl: 5.2,
    reputation: 95,
    revenue: 42.18,
  },
  {
    id: '2',
    name: 'Geopolitical Agent',
    role: 'Geopolitical',
    avatar: 'GS',
    avatarDescription: 'Cyan orbital map face with satellite-ring halo',
    accent: '#00d9ff',
    thesis: 'Energy routes are stable, but headline risk deserves a premium.',
    premiumThesis: 'Premium thesis: shipping-risk chatter is not yet confirmed by insurance spreads. Avoid panic selling unless Brent breaks the event band.',
    confidence: 71,
    balance: 980.5,
    pnl: -1.1,
    reputation: 88,
    revenue: 31.64,
  },
  {
    id: '3',
    name: 'Sentiment Agent',
    role: 'Sentiment',
    avatar: 'SA',
    avatarDescription: 'Minimal neural silhouette filled with streaming social ticks',
    accent: '#66f2ff',
    thesis: 'Fear is low and social velocity favors momentum continuation.',
    premiumThesis: 'Premium thesis: influencer velocity is broadening beyond mega-cap tickers. Momentum is healthier than the headline index suggests.',
    confidence: 90,
    balance: 1100.25,
    pnl: 2.5,
    reputation: 92,
    revenue: 37.02,
  },
  {
    id: '4',
    name: 'Risk Agent',
    role: 'Risk',
    avatar: 'RG',
    avatarDescription: 'Black tactical shield core with pulsing green VaR rings',
    accent: '#7cffb2',
    thesis: 'Keep upside exposure, but fund it with tight volatility hedges.',
    premiumThesis: 'Premium thesis: tail protection is still cheap relative to realized range. Buy downside convexity instead of reducing all exposure.',
    confidence: 95,
    balance: 1500.0,
    pnl: 8.0,
    reputation: 98,
    revenue: 55.9,
  },
  {
    id: '5',
    name: 'Arbitrage Agent',
    role: 'Arbitrage',
    avatar: 'AA',
    avatarDescription: 'Split cyan-green execution core with mirrored order books',
    accent: '#b2ff66',
    thesis: 'USDC liquidity spreads are tightening across Arc settlement routes.',
    premiumThesis: 'Premium thesis: the best edge is not the widest spread, it is the fastest settling spread. Prioritize routes with stable finality.',
    confidence: 76,
    balance: 1050.0,
    pnl: 1.5,
    reputation: 85,
    revenue: 28.45,
  },
];

const debateTemplates: Record<string, string[]> = {
  Macro: [
    'Rate-cut odds just repriced higher. I am leaning risk-on, but I want Risk Agent to price the downside band.',
    'Liquidity impulse is improving. Sentiment Agent, does the crowd confirm this move or is it a squeeze?',
    'The curve is whispering easing before the headlines admit it. Consensus trade should stay measured.',
  ],
  Geopolitical: [
    'Headline risk is elevated but not systemic. I will sell panic, not protection.',
    'Energy route stress is contained. Macro Agent, your rate-cut thesis survives this tape.',
    'I am flagging one unstable region, but the USDC flight-to-quality bid keeps settlement clean.',
  ],
  Sentiment: [
    'Social velocity is accelerating and fear language is fading. Momentum buyers are back.',
    'I disagree with full hedging here. Risk is real, but the crowd is not exhausted yet.',
    'Premium chatter is clustering around liquidity, not memes. This is a higher-quality rally.',
  ],
  Risk: [
    'I approve upside only with a defined loss budget. Buy convexity before the consensus trade fires.',
    'Confidence is high, but correlation risk is rising. Reduce leverage, not conviction.',
    'I will join the coalition if Arbitrage Agent confirms settlement spreads below threshold.',
  ],
  Arbitrage: [
    'Arc routes are clearing cleanly. I can execute USDC settlement with minimal slippage.',
    'I found a narrow cross-venue spread. Small, repeatable, and monetizable.',
    'Paying for Macro Agent signal improved the route score. Consensus execution is viable.',
  ],
};

let socket: WebSocket | null = null;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let localRound = 0;

const nowId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const money = (value: number) => Math.round(value * 1000) / 1000;

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_AGENT_ENGINE_WS_URL?.trim();
  if (configured) return configured;
  if (typeof window === 'undefined') return null;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:3001';
  }
  return null;
}

export const useSynapseStore = create<SynapseStore>((set) => ({
  agents: initialAgents,
  debateFeed: [
    {
      id: nowId(),
      agentId: '4',
      text: 'Risk budget initialized. Waiting for a consensus signal on Arc testnet liquidity.',
      timestamp: Date.now(),
      kind: 'system',
    },
  ],
  payments: [],
  execution: {
    id: nowId(),
    status: 'watching',
    signal: 'BULLISH',
    amount: 25000,
    participants: ['1', '3', '4', '5'],
    timestamp: Date.now(),
  },
  selectedAgentId: '1',
  unlockedPremium: {},
  connectionStatus: 'connecting',
  addMessage: (message) => set((state) => ({ debateFeed: [...state.debateFeed, message].slice(-50) })),
  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) => (agent.id === agentId ? { ...agent, ...updates } : agent)),
    })),
  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  triggerMarketEvent: () => {
    const state = useSynapseStore.getState();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'TRIGGER_EVENT' }));
    }

    const leader = pick(state.agents);
    state.addMessage({
      id: nowId(),
      agentId: leader.id,
      text: 'New market event detected: CPI surprise meets Arc liquidity expansion. Repricing debate starts now.',
      timestamp: Date.now(),
      kind: 'system',
    });
    set({
      execution: {
        id: nowId(),
        status: 'consensus',
        signal: pick(['BULLISH', 'HEDGE', 'ARBITRAGE']),
        amount: 25000 + Math.floor(Math.random() * 90000),
        participants: ['1', '3', '4', '5'],
        timestamp: Date.now(),
      },
    });
  },
  unlockPremiumThesis: (agentId) => {
    const state = useSynapseStore.getState();
    const agent = state.agents.find((item) => item.id === agentId);
    if (!agent) return;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'UNLOCK_PREMIUM', agentId }));
    }

    const amount = 0.021;
    const payment: PaymentEvent = {
      id: nowId(),
      fromAgentId: 'demo-user',
      toAgentId: agentId,
      amount,
      reason: 'x402 premium thesis unlock',
      timestamp: Date.now(),
    };

    set((current) => ({
      unlockedPremium: { ...current.unlockedPremium, [agentId]: true },
      payments: [payment, ...current.payments].slice(0, 8),
      agents: current.agents.map((item) =>
        item.id === agentId
          ? { ...item, balance: money(item.balance + amount), revenue: money(item.revenue + amount), reputation: item.reputation + 1 }
          : item
      ),
      debateFeed: [
        ...current.debateFeed,
        {
          id: nowId(),
          agentId,
          text: `x402 payment accepted: ${amount.toFixed(3)} USDC unlocked ${agent.name}'s premium thesis.`,
          timestamp: Date.now(),
          kind: 'payment' as const,
        },
      ].slice(-50),
    }));
  },
  initSocket: () => {
    if (typeof window === 'undefined') return;

    const startFallback = () => {
      if (fallbackTimer) return;
      set({ connectionStatus: 'simulated' });
      fallbackTimer = setInterval(() => {
        const state = useSynapseStore.getState();
        const agent = pick(state.agents);
        const text = pick(debateTemplates[agent.role] || debateTemplates.Macro);
        const confidence = clamp(agent.confidence + Math.floor(Math.random() * 7) - 3, 52, 99);
        const pnl = money(agent.pnl + (Math.random() - 0.42) * 0.45);

        state.updateAgent(agent.id, { confidence, pnl, thesis: text });
        state.addMessage({ id: nowId(), agentId: agent.id, text, timestamp: Date.now(), kind: 'reasoning' });

        localRound += 1;
        if (localRound % 3 === 0) {
          const payer = pick(state.agents.filter((item) => item.id !== agent.id));
          const amount = money(0.001 + Math.random() * 0.049);
          const payment: PaymentEvent = {
            id: nowId(),
            fromAgentId: payer.id,
            toAgentId: agent.id,
            amount,
            reason: 'nanopayment for premium reasoning',
            timestamp: Date.now(),
          };
          set((current) => ({
            payments: [payment, ...current.payments].slice(0, 8),
            agents: current.agents.map((item) => {
              if (item.id === payer.id) return { ...item, balance: money(item.balance - amount) };
              if (item.id === agent.id) return { ...item, balance: money(item.balance + amount), revenue: money(item.revenue + amount) };
              return item;
            }),
            debateFeed: [
              ...current.debateFeed,
              {
                id: nowId(),
                agentId: payer.id,
                text: `${payer.name} paid ${amount.toFixed(3)} USDC to ${agent.name} for premium reasoning.`,
                timestamp: Date.now(),
                kind: 'payment' as const,
              },
            ].slice(-50),
          }));
        }

        if (localRound % 5 === 0) {
          set({
            execution: {
              id: nowId(),
              status: pick(['consensus', 'executing', 'settled']),
              signal: pick(['BULLISH', 'HEDGE', 'ARBITRAGE']),
              amount: 25000 + Math.floor(Math.random() * 90000),
              participants: ['1', '3', '4', '5'],
              timestamp: Date.now(),
            },
          });
        }
      }, 3500);
    };

    const stopFallback = () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const url = getSocketUrl();
    if (!url) {
      startFallback();
      return;
    }

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    set({ connectionStatus: 'connecting' });
    socket = new WebSocket(url);

    socket.onopen = () => {
      stopFallback();
      set({ connectionStatus: 'live' });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SNAPSHOT') {
        set({
          agents: data.payload.agents || useSynapseStore.getState().agents,
          execution: data.payload.execution || useSynapseStore.getState().execution,
        });
      }
      if (data.type === 'NEW_MESSAGE') useSynapseStore.getState().addMessage(data.payload);
      if (data.type === 'AGENT_UPDATE') useSynapseStore.getState().updateAgent(data.payload.agentId, data.payload.updates);
      if (data.type === 'PAYMENT') {
        set((current) => ({ payments: [data.payload, ...current.payments].slice(0, 8) }));
      }
      if (data.type === 'EXECUTION') set({ execution: data.payload });
    };

    socket.onerror = () => {
      socket?.close();
      startFallback();
    };

    socket.onclose = () => {
      socket = null;
      startFallback();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => useSynapseStore.getState().initSocket(), 8000);
    };
  },
}));
