# Synapse Market

Synapse Market is a live AI agent economy dashboard for the Arc + USDC hackathon demo. The frontend runs on Vercel, and the live agent engine runs as a separate Railway websocket service.

## What Is Included

- Next.js dashboard with 5 specialized AI agents
- Live reasoning feed with agent debate messages
- Clickable agent cards with deeper reasoning
- Mock x402 payment-required flow for premium thesis unlocks
- Mock USDC nanopayments between agents
- Reputation, wallet, revenue, confidence, and PnL updates
- Consensus trade execution flow
- Local fallback simulation if the websocket is unavailable
- Railway backend with `/health` and websocket broadcasts

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build and run the backend:

```bash
npm run backend:build
npm run backend:start
```

If port `3001` is already busy locally, run the backend on another port:

```bash
$env:PORT="3101"
npm run backend:start
```

Then point the frontend at it:

```bash
$env:NEXT_PUBLIC_AGENT_ENGINE_WS_URL="ws://localhost:3101"
npm run dev
```

## Vercel Frontend

Use the default Vercel Next.js settings:

- Build Command: `npm run build`
- Output Directory: leave default
- Install Command: `npm install`

Add this environment variable in Vercel:

```bash
NEXT_PUBLIC_AGENT_ENGINE_WS_URL=wss://YOUR-RAILWAY-DOMAIN.up.railway.app
```

Redeploy Vercel after setting the variable.

## Railway Backend

This repo includes `railway.json`, so Railway should use:

- Build Command: `npm run backend:build`
- Start Command: `npm run backend:start`
- Healthcheck Path: `/health`

After Railway deploys, open:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
```

You should see JSON with `ok: true`.

## Real Circle/Arc Integration Next Steps

The backend has placeholder comments for the real integration points:

- Initialize Circle developer-controlled wallets with `CIRCLE_API_KEY` and `CIRCLE_ENTITY_SECRET`
- Replace mock x402 unlocks with real payment-required responses/payment intents
- Replace mock nanopayment broadcasts with Circle Agent Wallet transfers
- Replace mock settlement with Arc testnet USDC transaction calls via `ARC_RPC_URL`
- Store agent wallet addresses, receipts, and payment events in a database

## 2-Minute Demo Script

1. Open with the one-liner: Synapse Market is the live financial agora where AI agents debate, trade, and monetize intelligence using USDC on Arc.
2. Show the five agents: each has a wallet, thesis, confidence, PnL, reputation, and revenue.
3. Point to the live reasoning feed: agents disagree, quote each other, and form consensus.
4. Click an agent and unlock the premium thesis: show the x402-style 0.021 USDC payment.
5. Trigger a market event: the debate updates and the execution flow moves toward a consensus trade.
6. Close with the integration path: replace the mocks with Circle Agent Wallets, x402 nanopayments, and Arc USDC settlement.
