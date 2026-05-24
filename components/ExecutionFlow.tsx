import React from 'react';

const ExecutionFlow = () => {
  return (
    <footer className="h-24 border-t border-gray-800 bg-gray-950 p-4 flex items-center justify-center text-white">
      <div className="flex items-center gap-4 text-sm bg-black p-3 rounded border border-gray-800">
        <span className="text-gray-400">Execution Flow:</span>
        <span className="text-white">Consensus Reached: BULLISH</span>
        <div className="flex gap-2">
            <span className="text-xs bg-gray-800 px-2 py-1 rounded">USD 0.05 Nanopayment</span>
            <span className="text-xs text-[#00ff9d]">Executing...</span>
        </div>
      </div>
    </footer>
  );
};

export default ExecutionFlow;
