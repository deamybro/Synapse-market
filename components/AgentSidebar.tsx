"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';
import { motion } from 'framer-motion';
import { LockKeyhole, Wallet } from 'lucide-react';

const AgentSidebar = () => {
  const agents = useSynapseStore((state) => state.agents);
  const selectedAgentId = useSynapseStore((state) => state.selectedAgentId);
  const selectAgent = useSynapseStore((state) => state.selectAgent);

  return (
    <aside className="border-b border-[#12352b] bg-black p-4 text-white lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.28em] text-gray-400">Agent Wallets</h2>
        <span className="rounded border border-[#12352b] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">5 live</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {agents.map((agent) => (
          <motion.button
            key={agent.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => selectAgent(agent.id)}
            className={`w-full rounded border bg-[#050908] p-3 text-left transition ${
              selectedAgentId === agent.id ? 'border-[#00ff9d] shadow-[0_0_22px_rgba(0,255,157,0.16)]' : 'border-[#12352b] hover:border-cyan-400'
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="data-font grid size-11 place-items-center rounded border text-sm font-black"
                style={{ borderColor: agent.accent, color: agent.accent, boxShadow: `0 0 18px ${agent.accent}33` }}
              >
                {agent.avatar}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{agent.name}</p>
                <p className="truncate text-[11px] text-gray-500">{agent.avatarDescription}</p>
              </div>
            </div>

            <p className="mb-3 min-h-10 text-xs leading-5 text-gray-300">{agent.thesis}</p>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-900">
              <motion.div
                className="h-full bg-[#00ff9d]"
                animate={{ width: `${agent.confidence}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <div className="data-font grid grid-cols-3 gap-2 text-[11px] text-gray-500">
              <span>{agent.confidence}% conf</span>
              <motion.span
                key={agent.pnl}
                className={agent.pnl >= 0 ? 'text-[#00ff9d]' : 'text-red-400'}
              >
                {agent.pnl > 0 ? '+' : ''}{agent.pnl}%
              </motion.span>
              <span className="text-right text-cyan-200">K {agent.reputation}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#12352b] pt-2 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Wallet size={12} />
                {agent.balance.toFixed(3)} USDC
              </span>
              <span className={`inline-flex items-center gap-1 ${agent.walletStatus === 'live' ? 'text-[#00ff9d]' : 'text-cyan-200'}`}>
                <LockKeyhole size={12} />
                {agent.walletStatus === 'live' ? 'Circle' : 'premium'}
              </span>
            </div>
            {agent.walletAddress && (
              <p className="data-font mt-2 truncate text-[10px] text-gray-500">{agent.walletAddress}</p>
            )}
          </motion.button>
        ))}
      </div>
    </aside>
  );
};

export default AgentSidebar;
