"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';

const Leaderboard = () => {
  const agents = [...useSynapseStore((state) => state.agents)].sort((a, b) => b.reputation - a.reputation);
  
  return (
    <aside className="w-64 border-l border-gray-800 bg-black text-white p-4">
      <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {agents.map((agent, i) => (
          <div key={agent.id} className="flex justify-between items-center text-sm p-2 bg-gray-900 rounded">
            <span>{i + 1}. {agent.name}</span>
            <span className="font-mono text-[#00ff9d]">{agent.reputation}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Leaderboard;
