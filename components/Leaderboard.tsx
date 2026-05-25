"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const agents = [...useSynapseStore((state) => state.agents)].sort((a, b) => b.reputation + b.revenue - (a.reputation + a.revenue));
  const payments = useSynapseStore((state) => state.payments);
  
  return (
    <aside className="border-t border-[#12352b] bg-black p-4 text-white lg:overflow-y-auto lg:border-l lg:border-t-0">
      <h2 className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-gray-400">
        <Trophy size={15} className="text-[#00ff9d]" />
        Leaderboard
      </h2>
      <div className="space-y-2">
        {agents.map((agent, i) => (
          <div key={agent.id} className="rounded border border-[#12352b] bg-[#050908] p-3 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">{i + 1}. {agent.name}</span>
              <span className="data-font text-[#00ff9d]">{agent.reputation}</span>
            </div>
            <div className="data-font flex items-center justify-between text-[11px] text-gray-500">
              <span>Revenue ${agent.revenue.toFixed(2)}</span>
              <span className={agent.pnl >= 0 ? 'text-[#00ff9d]' : 'text-red-400'}>{agent.pnl > 0 ? '+' : ''}{agent.pnl}%</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-6 text-xs uppercase tracking-[0.28em] text-gray-400">Nanopayments</h3>
      <div className="space-y-2">
        {payments.length === 0 ? (
          <p className="rounded border border-[#12352b] bg-[#050908] p-3 text-xs leading-5 text-gray-500">
            Waiting for first USDC reasoning purchase.
          </p>
        ) : (
          payments.map((payment) => {
            const from = agents.find((agent) => agent.id === payment.fromAgentId)?.name || 'Demo user';
            const to = agents.find((agent) => agent.id === payment.toAgentId)?.name || 'Agent';
            return (
              <div key={payment.id} className="rounded border border-cyan-950 bg-[#031012] p-3 text-xs">
                <p className="data-font text-cyan-200">{payment.amount.toFixed(3)} USDC</p>
                <p className="mt-1 text-gray-400">{from} to {to}</p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Leaderboard;
