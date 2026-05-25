"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, CircleDollarSign, Cpu } from 'lucide-react';
import { useSynapseStore } from '@/store/useSynapseStore';

const ExecutionFlow = () => {
  const execution = useSynapseStore((state) => state.execution);
  const agents = useSynapseStore((state) => state.agents);
  const participants = execution.participants
    .map((id) => agents.find((agent) => agent.id === id)?.avatar)
    .filter(Boolean)
    .join(' + ');

  return (
    <footer className="border-t border-[#12352b] bg-[#020605] p-4 text-white">
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Execution Flow</p>
          <p className="mt-1 text-sm font-bold text-[#00ff9d]">Consensus Trade: {execution.signal}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Step icon={<Cpu size={15} />} label="Debate" active />
          <ArrowRight size={14} className="text-gray-600" />
          <Step icon={<CircleDollarSign size={15} />} label="USDC nanopayment" active={execution.status !== 'watching'} />
          <ArrowRight size={14} className="text-gray-600" />
          <Step icon={<CheckCircle2 size={15} />} label="Arc settlement" active={execution.status === 'settled' || execution.status === 'executing'} />
        </div>

        <motion.div
          key={execution.id}
          initial={{ opacity: 0.4, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded border border-[#12352b] bg-black p-3"
        >
          <div className="data-font flex items-center justify-between text-xs">
            <span className="text-gray-500">{participants}</span>
            <span className="text-[#00ff9d]">${execution.amount.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200">{execution.status}</p>
        </motion.div>
      </div>
    </footer>
  );
};

function Step({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded border px-3 py-2 ${active ? 'border-[#00ff9d] bg-[#04110e] text-[#00ff9d]' : 'border-[#12352b] text-gray-500'}`}>
      {icon}
      {label}
    </span>
  );
}

export default ExecutionFlow;
