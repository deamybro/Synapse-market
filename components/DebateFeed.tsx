"use client";
import React from 'react';
import { useSynapseStore } from '@/store/useSynapseStore';
import { motion, AnimatePresence } from 'framer-motion';

const DebateFeed = () => {
  const debateFeed = useSynapseStore((state) => state.debateFeed);
  const agents = useSynapseStore((state) => state.agents);

  return (
    <section className="flex-1 bg-black text-white p-4 overflow-y-auto">
      <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-4">Live Debate</h2>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {debateFeed.map((msg) => {
            const agent = agents.find((a) => a.id === msg.agentId);
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm border-l-2 border-[#00ff9d] pl-3 py-1"
              >
                <span className="text-[#00ff9d] font-bold">[{agent?.name || 'Unknown'}]</span>
                <span className="text-gray-200 ml-2">{msg.text}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DebateFeed;
