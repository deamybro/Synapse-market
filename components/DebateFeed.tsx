"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, LockKeyhole, MessageSquareText, Sparkles } from 'lucide-react';

const DebateFeed = () => {
  const debateFeed = useSynapseStore((state) => state.debateFeed);
  const agents = useSynapseStore((state) => state.agents);
  const selectedAgentId = useSynapseStore((state) => state.selectedAgentId);
  const unlockedPremium = useSynapseStore((state) => state.unlockedPremium);
  const unlockPremiumThesis = useSynapseStore((state) => state.unlockPremiumThesis);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || agents[0];

  return (
    <section className="min-h-[520px] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.08),transparent_34%),#000] p-4 text-white">
      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded border border-[#12352b] bg-[#020404] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-gray-400">
              <MessageSquareText size={15} className="text-[#00ff9d]" />
              Live Reasoning Feed
            </h2>
            <span className="data-font text-xs text-cyan-200">{debateFeed.length} signals</span>
          </div>
          <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {debateFeed.map((msg) => {
                const agent = agents.find((a) => a.id === msg.agentId);
                const border = msg.kind === 'payment' ? 'border-cyan-300' : msg.kind === 'system' ? 'border-yellow-300' : 'border-[#00ff9d]';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded border-l-2 ${border} bg-[#050908] px-3 py-3 text-sm`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-bold" style={{ color: agent?.accent || '#00ff9d' }}>
                        {agent?.name || 'System'}
                      </span>
                      <span className="data-font shrink-0 text-[11px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-6 text-gray-200">{msg.text}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded border border-[#12352b] bg-[#020404] p-4">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="data-font grid size-12 place-items-center rounded border text-sm font-black"
              style={{ borderColor: selectedAgent.accent, color: selectedAgent.accent, boxShadow: `0 0 18px ${selectedAgent.accent}33` }}
            >
              {selectedAgent.avatar}
            </span>
            <div>
              <h3 className="font-bold">{selectedAgent.name}</h3>
              <p className="text-xs text-gray-500">{selectedAgent.role} specialist</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <p className="leading-6 text-gray-300">{selectedAgent.thesis}</p>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Confidence" value={`${selectedAgent.confidence}%`} />
              <Metric label="Revenue" value={`$${selectedAgent.revenue.toFixed(2)}`} />
              <Metric label="Wallet" value={`${selectedAgent.balance.toFixed(1)}`} />
            </div>
            {selectedAgent.walletAddress && (
              <div className="rounded border border-[#12352b] bg-black p-2">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-gray-500">Arc Address</p>
                <p className="data-font truncate text-xs text-cyan-200">{selectedAgent.walletAddress}</p>
              </div>
            )}
            <div className="rounded border border-[#12352b] bg-black p-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles size={14} />
                Premium Thesis
              </div>
              {unlockedPremium[selectedAgent.id] ? (
                <p className="leading-6 text-[#00ff9d]">{selectedAgent.premiumThesis}</p>
              ) : (
                <div>
                  <p className="mb-3 leading-6 text-gray-400">
                    x402-style payment required. Unlock this agent&apos;s paid reasoning with a mock USDC nanopayment.
                  </p>
                  <button
                    onClick={() => unlockPremiumThesis(selectedAgent.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-cyan-300 bg-cyan-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:bg-[#00ff9d]"
                  >
                    <CreditCard size={14} />
                    Pay 0.021 USDC
                    <LockKeyhole size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#12352b] bg-black p-2">
      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="data-font text-sm text-[#00ff9d]">{value}</p>
    </div>
  );
}

export default DebateFeed;
