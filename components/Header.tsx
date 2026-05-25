"use client";
import React from 'react';
import { Activity, RadioTower, Zap } from 'lucide-react';
import { useSynapseStore } from '@/store/useSynapseStore';

const Header = () => {
  const connectionStatus = useSynapseStore((state) => state.connectionStatus);
  const circleStatus = useSynapseStore((state) => state.circleStatus);
  const triggerMarketEvent = useSynapseStore((state) => state.triggerMarketEvent);

  return (
    <header className="flex flex-col gap-4 border-b border-[#12352b] bg-black px-4 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-black tracking-[0.02em] sm:text-2xl">
          <span className="text-white">Synapse </span>
          <span className="text-[#00ff9d]">Market</span>
          <span className="ml-3 align-middle text-xs font-medium uppercase tracking-[0.25em] text-cyan-200">
            Live AI Agent Economy on Arc + USDC
          </span>
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Demo on Arc Testnet + Circle Agent Wallets and Nanopayments
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded border border-[#1f4038] bg-[#04110e] px-3 py-2 text-xs text-cyan-100">
          <RadioTower size={14} className="text-[#00ff9d]" />
          {connectionStatus === 'live' ? 'Railway Agent Engine' : connectionStatus === 'connecting' ? 'Connecting' : 'Local Agent Simulation'}
        </span>
        <span className="inline-flex items-center gap-2 rounded border border-[#1f4038] bg-[#04110e] px-3 py-2 text-xs text-[#00ff9d]">
          <Activity size={14} />
          {circleStatus.ready ? 'Circle Arc wallets live' : circleStatus.enabled ? 'Circle connecting' : 'x402 mock flow ready'}
        </span>
        <button
          onClick={triggerMarketEvent}
          className="inline-flex items-center gap-2 rounded border border-[#00ff9d] bg-[#00ff9d] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_24px_rgba(0,255,157,0.25)] transition hover:bg-cyan-200"
        >
          <Zap size={14} />
          Trigger Market Event
        </button>
      </div>
    </header>
  );
};

export default Header;
