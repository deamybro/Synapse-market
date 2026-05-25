import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import {
  Blockchain,
  FeeLevel,
  initiateDeveloperControlledWalletsClient,
  type CircleDeveloperControlledWalletsClient,
  type Wallet,
} from '@circle-fin/developer-controlled-wallets';

dotenv.config();

type Agent = {
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
  walletId?: string;
  walletAddress?: string;
  walletStatus?: 'mock' | 'live' | 'pending' | 'error';
  usdcTokenId?: string;
};

type PaymentEvent = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  amount: number;
  reason: string;
  timestamp: number;
  mode?: 'mock' | 'circle';
  transactionId?: string;
  txHash?: string;
  status?: string;
  error?: string;
};

type ExecutionEvent = {
  id: string;
  status: 'watching' | 'consensus' | 'executing' | 'settled';
  signal: 'BULLISH' | 'BEARISH' | 'HEDGE' | 'ARBITRAGE';
  amount: number;
  participants: string[];
  timestamp: number;
};

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ARC_BLOCKCHAIN = 'ARC-TESTNET' as Blockchain;
const WALLET_SET_NAME = 'Synapse Market Agent Wallets';
const AGENT_REF_PREFIX = 'synapse-market-agent';

app.use(express.json());
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const agents: Agent[] = [
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

let round = 0;
let circleStatus = {
  enabled: false,
  ready: false,
  message: 'Circle credentials are not configured.',
  walletSetId: process.env.CIRCLE_WALLET_SET_ID || '',
};
let circleClient: CircleDeveloperControlledWalletsClient | null = null;

let execution: ExecutionEvent = {
  id: id(),
  status: 'watching',
  signal: 'BULLISH',
  amount: 25000,
  participants: ['1', '3', '4', '5'],
  timestamp: Date.now(),
};

configureCircle().catch((error) => {
  circleStatus = {
    ...circleStatus,
    enabled: hasCircleCredentials(),
    ready: false,
    message: `Circle initialization failed: ${safeError(error)}`,
  };
  console.warn(circleStatus.message);
});

app.get('/', (_, res) => {
  res.json({
    name: 'Synapse Market Agent Engine',
    status: 'online',
    websocket: 'connect to this same Railway URL with wss://',
    circle: circleStatus,
  });
});

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    agents: agents.length,
    round,
    uptime: process.uptime(),
    circle: circleStatus,
  });
});

app.get('/circle/status', (_, res) => {
  res.json({ circle: circleStatus, agents: agents.map(agentPublicWallet) });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Synapse Market agent engine listening on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (client) => {
  send(client, 'SNAPSHOT', { agents, execution, circle: circleStatus });
  send(client, 'NEW_MESSAGE', {
    id: id(),
    agentId: '4',
    text: 'Railway agent engine connected. Live debate stream is online.',
    timestamp: Date.now(),
    kind: 'system',
  });

  client.on('message', (raw) => {
    try {
      const event = JSON.parse(raw.toString());
      if (event.type === 'TRIGGER_EVENT') triggerMarketEvent();
      if (event.type === 'UNLOCK_PREMIUM') unlockPremium(event.agentId);
    } catch (error) {
      console.warn('Ignored invalid websocket message', error);
    }
  });
});

setInterval(simulateRound, 4500);

function simulateRound() {
  const agent = pick(agents);
  const text = pick(debateTemplates[agent.role] || debateTemplates.Macro);
  const confidence = clamp(agent.confidence + Math.floor(Math.random() * 7) - 3, 52, 99);
  const pnl = money(agent.pnl + (Math.random() - 0.42) * 0.45);

  Object.assign(agent, { confidence, pnl, thesis: text });
  broadcast('AGENT_UPDATE', { agentId: agent.id, updates: { confidence, pnl, thesis: text } });
  broadcast('NEW_MESSAGE', { id: id(), agentId: agent.id, text, timestamp: Date.now(), kind: 'reasoning' });

  round += 1;
  if (round % 3 === 0) {
    const payer = pick(agents.filter((item) => item.id !== agent.id));
    createPayment(payer.id, agent.id, money(0.001 + Math.random() * 0.049), 'nanopayment for premium reasoning');
  }

  if (round % 5 === 0) {
    execution = {
      id: id(),
      status: pick(['consensus', 'executing', 'settled']),
      signal: pick(['BULLISH', 'HEDGE', 'ARBITRAGE']),
      amount: 25000 + Math.floor(Math.random() * 90000),
      participants: ['1', '3', '4', '5'],
      timestamp: Date.now(),
    };
    broadcast('EXECUTION', execution);
  }
}

function triggerMarketEvent() {
  const leader = pick(agents);
  execution = {
    id: id(),
    status: 'consensus',
    signal: pick(['BULLISH', 'HEDGE', 'ARBITRAGE']),
    amount: 25000 + Math.floor(Math.random() * 90000),
    participants: ['1', '3', '4', '5'],
    timestamp: Date.now(),
  };
  broadcast('NEW_MESSAGE', {
    id: id(),
    agentId: leader.id,
    text: 'New market event detected: CPI surprise meets Arc liquidity expansion. Repricing debate starts now.',
    timestamp: Date.now(),
    kind: 'system',
  });
  broadcast('EXECUTION', execution);
}

function unlockPremium(agentId: string) {
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) return;
  createPayment(process.env.AGENT_WALLET_ID ? 'treasury' : 'demo-user', agentId, 0.021, 'x402 premium thesis unlock');
  broadcast('NEW_MESSAGE', {
    id: id(),
    agentId,
    text: `x402 payment accepted: 0.021 USDC unlocked ${agent.name}'s premium thesis.`,
    timestamp: Date.now(),
    kind: 'payment',
  });
}

async function configureCircle() {
  if (!hasCircleCredentials()) {
    broadcast('CIRCLE_STATUS', circleStatus);
    return;
  }

  circleStatus = {
    enabled: true,
    ready: false,
    message: 'Connecting to Circle developer-controlled wallets.',
    walletSetId: process.env.CIRCLE_WALLET_SET_ID || '',
  };

  circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY || '',
    entitySecret: process.env.CIRCLE_ENTITY_SECRET || '',
  });

  const walletSetId = await resolveWalletSetId(circleClient);
  circleStatus.walletSetId = walletSetId;

  await hydrateAgentWallets(circleClient, walletSetId);
  await refreshAgentBalances(circleClient);

  circleStatus = {
    ...circleStatus,
    ready: true,
    message: 'Circle Agent Wallets are live on Arc testnet.',
  };

  broadcast('SNAPSHOT', { agents, execution, circle: circleStatus });
}

async function resolveWalletSetId(client: CircleDeveloperControlledWalletsClient) {
  if (process.env.CIRCLE_WALLET_SET_ID) return process.env.CIRCLE_WALLET_SET_ID;

  const walletSets = await client.listWalletSets();
  const existing = walletSets.data?.walletSets?.find((walletSet) => 'name' in walletSet && walletSet.name === WALLET_SET_NAME);
  if (existing?.id) return existing.id;

  const created = await client.createWalletSet({
    name: WALLET_SET_NAME,
    idempotencyKey: randomUUID(),
  });
  const id = created.data?.walletSet?.id;
  if (!id) throw new Error('Circle did not return a wallet set id.');
  return id;
}

async function hydrateAgentWallets(client: CircleDeveloperControlledWalletsClient, walletSetId: string) {
  const configuredWalletIds = parseAgentWalletIds();

  for (const agent of agents) {
    const configuredId = configuredWalletIds[agent.id] || (agent.id === '1' ? process.env.AGENT_WALLET_ID : undefined);
    if (configuredId) {
      await attachWalletById(client, agent, configuredId);
      continue;
    }

    const refId = `${AGENT_REF_PREFIX}-${agent.id}`;
    const listed = await client.listWallets({ blockchain: ARC_BLOCKCHAIN, walletSetId, refId });
    const existing = listed.data?.wallets?.[0];
    if (existing) {
      attachWallet(agent, existing);
      continue;
    }

    agent.walletStatus = 'pending';
    const created = await client.createWallets({
      blockchains: [ARC_BLOCKCHAIN],
      count: 1,
      walletSetId,
      metadata: [{ name: agent.name, refId }],
      accountType: 'EOA',
      idempotencyKey: randomUUID(),
    });
    const wallet = created.data?.wallets?.[0];
    if (!wallet) throw new Error(`Circle did not return a wallet for ${agent.name}.`);
    attachWallet(agent, wallet);
  }
}

async function attachWalletById(client: CircleDeveloperControlledWalletsClient, agent: Agent, walletId: string) {
  const response = await client.getWallet({ id: walletId });
  const wallet = response.data?.wallet;
  if (!wallet) throw new Error(`Circle wallet ${walletId} was not found for ${agent.name}.`);
  attachWallet(agent, wallet);
}

function attachWallet(agent: Agent, wallet: Wallet) {
  agent.walletId = wallet.id;
  agent.walletAddress = wallet.address;
  agent.walletStatus = 'live';
  broadcast('AGENT_UPDATE', {
    agentId: agent.id,
    updates: {
      walletId: agent.walletId,
      walletAddress: agent.walletAddress,
      walletStatus: agent.walletStatus,
    },
  });
}

async function refreshAgentBalances(client: CircleDeveloperControlledWalletsClient) {
  await Promise.all(
    agents.map(async (agent) => {
      if (!agent.walletId) return;
      try {
        const balances = await client.getWalletTokenBalance({ id: agent.walletId, includeAll: true });
        const usdc = balances.data?.tokenBalances?.find((balance) => {
          const token = balance.token;
          return token.symbol === 'USDC' && token.blockchain === ARC_BLOCKCHAIN;
        });
        if (usdc) {
          agent.balance = Number(usdc.amount);
          agent.usdcTokenId = usdc.token.id;
          broadcast('AGENT_UPDATE', {
            agentId: agent.id,
            updates: { balance: agent.balance, usdcTokenId: agent.usdcTokenId },
          });
        }
      } catch (error) {
        console.warn(`Could not refresh Circle balance for ${agent.name}: ${safeError(error)}`);
      }
    })
  );
}

async function createPayment(fromAgentId: string, toAgentId: string, amount: number, reason: string) {
  if (circleClient && circleStatus.ready) {
    const result = await createCirclePayment(circleClient, fromAgentId, toAgentId, amount, reason);
    if (result) return;
  }

  createMockPayment(fromAgentId, toAgentId, amount, reason);
}

async function createCirclePayment(
  client: CircleDeveloperControlledWalletsClient,
  fromAgentId: string,
  toAgentId: string,
  amount: number,
  reason: string
) {
  const from = resolvePaymentSource(fromAgentId);
  const to = agents.find((item) => item.id === toAgentId);
  const tokenId = process.env.CIRCLE_USDC_TOKEN_ID || from?.usdcTokenId || agents.find((agent) => agent.usdcTokenId)?.usdcTokenId;

  if (!from?.walletId || !to?.walletAddress || !tokenId) {
    broadcast('NEW_MESSAGE', {
      id: id(),
      agentId: to?.id || '4',
      text: 'Circle transfer skipped: fund/configure an Arc testnet USDC source wallet and token id first.',
      timestamp: Date.now(),
      kind: 'system',
    });
    return false;
  }

  try {
    const response = await client.createTransaction({
      walletId: from.walletId,
      destinationAddress: to.walletAddress,
      tokenId,
      amount: [amount.toFixed(3)],
      fee: {
        type: 'level',
        config: {
          feeLevel: FeeLevel.Medium,
        },
      },
      refId: `synapse:${reason}:${Date.now()}`,
      idempotencyKey: randomUUID(),
    });

    const transaction = response.data;
    const payment: PaymentEvent = {
      id: id(),
      fromAgentId,
      toAgentId,
      amount,
      reason,
      timestamp: Date.now(),
      mode: 'circle',
      transactionId: transaction?.id,
      status: transaction?.state,
    };

    applyPaymentAccounting(fromAgentId, toAgentId, amount, reason);
    broadcast('PAYMENT', payment);
    broadcast('NEW_MESSAGE', {
      id: id(),
      agentId: toAgentId,
      text: `Circle transfer submitted on Arc testnet: ${amount.toFixed(3)} USDC for ${reason}. Transaction ${transaction?.id || 'pending'}.`,
      timestamp: Date.now(),
      kind: 'payment',
    });

    setTimeout(() => refreshAgentBalances(client).catch((error) => console.warn(safeError(error))), 8000);
    return true;
  } catch (error) {
    const message = safeError(error);
    const payment: PaymentEvent = {
      id: id(),
      fromAgentId,
      toAgentId,
      amount,
      reason,
      timestamp: Date.now(),
      mode: 'circle',
      error: message,
      status: 'FAILED',
    };

    broadcast('PAYMENT', payment);
    broadcast('NEW_MESSAGE', {
      id: id(),
      agentId: toAgentId,
      text: `Circle transfer failed: ${message}`,
      timestamp: Date.now(),
      kind: 'system',
    });
    return false;
  }
}

function createMockPayment(fromAgentId: string, toAgentId: string, amount: number, reason: string) {
  applyPaymentAccounting(fromAgentId, toAgentId, amount, reason);
  const payment: PaymentEvent = { id: id(), fromAgentId, toAgentId, amount, reason, timestamp: Date.now(), mode: 'mock' };
  broadcast('PAYMENT', payment);
}

function applyPaymentAccounting(fromAgentId: string, toAgentId: string, amount: number, reason: string) {
  const from = agents.find((item) => item.id === fromAgentId);
  const to = agents.find((item) => item.id === toAgentId);

  if (from) {
    from.balance = money(from.balance - amount);
    broadcast('AGENT_UPDATE', { agentId: from.id, updates: { balance: from.balance } });
  }

  if (to) {
    to.balance = money(to.balance + amount);
    to.revenue = money(to.revenue + amount);
    to.reputation += reason.includes('x402') ? 1 : 0;
    broadcast('AGENT_UPDATE', {
      agentId: to.id,
      updates: { balance: to.balance, revenue: to.revenue, reputation: to.reputation },
    });
  }
}

function resolvePaymentSource(fromAgentId: string) {
  if (fromAgentId === 'treasury' && process.env.AGENT_WALLET_ID) {
    return agents.find((agent) => agent.walletId === process.env.AGENT_WALLET_ID) || agents.find((agent) => agent.walletId);
  }
  return agents.find((item) => item.id === fromAgentId);
}

function parseAgentWalletIds() {
  const raw = process.env.AGENT_WALLET_IDS;
  if (!raw) return {} as Record<string, string>;
  return raw.split(',').reduce<Record<string, string>>((acc, pair) => {
    const [agentId, walletId] = pair.split(':').map((value) => value.trim());
    if (agentId && walletId) acc[agentId] = walletId;
    return acc;
  }, {});
}

function hasCircleCredentials() {
  return Boolean(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);
}

function agentPublicWallet(agent: Agent) {
  return {
    id: agent.id,
    name: agent.name,
    walletId: agent.walletId,
    walletAddress: agent.walletAddress,
    walletStatus: agent.walletStatus || 'mock',
    balance: agent.balance,
    usdcTokenId: agent.usdcTokenId,
  };
}

function send(client: WebSocket, type: string, payload: unknown) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type, payload }));
  }
}

function broadcast(type: string, payload: unknown) {
  wss.clients.forEach((client) => send(client, type, payload));
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function money(value: number) {
  return Math.round(value * 1000) / 1000;
}

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return String(error);
}
