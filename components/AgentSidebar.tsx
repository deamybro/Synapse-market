"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';
import { motion } from 'framer-motion';

const AgentSidebar = () => {
  const agents = useSynapseStore((state) => state.agents);
  return (
    <aside className="w-64 border-r border-gray-800 bg-black text-white p-4 overflow-y-auto">
      <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-4">Agents</h2>
      <div className="space-y-4">
        {agents.map((agent) => (
          <motion.div 
            key={agent.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-gray-900 rounded border border-gray-800 hover:border-[#00ff9d] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{agent.avatar}</span>
              <span className="font-bold">{agent.name}</span>
            </div>
            <p className="text-xs text-gray-300 mb-1">{agent.thesis}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Conf: {agent.confidence}%</span>
              <motion.span 
                key={agent.pnl}
                className={agent.pnl >= 0 ? 'text-[#00ff9d]' : 'text-red-500'}
              >
                {agent.pnl > 0 ? '+' : ''}{agent.pnl}%
              </motion.span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Balance: ${agent.balance.toFixed(2)}</p>
          </motion.div>
        ))}
      </div>
    </aside>
  );
};

export default AgentSidebar;
