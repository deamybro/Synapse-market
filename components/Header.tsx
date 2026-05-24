import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-black text-white">
      <h1 className="text-2xl font-bold tracking-tighter">
        <span className="text-white">Synapse</span>
        <span className="text-[#00ff9d]">Market</span>
        <span className="text-gray-500 text-sm ml-2 font-normal">Live AI Agent Economy on Arc + USDC</span>
      </h1>
      <div className="flex gap-4">
        <span className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">Arc Testnet</span>
        <span className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">Circle Agent Wallets</span>
      </div>
    </header>
  );
};

export default Header;
