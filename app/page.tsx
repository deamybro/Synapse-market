"use client";
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import AgentSidebar from '@/components/AgentSidebar';
import DebateFeed from '@/components/DebateFeed';
import Leaderboard from '@/components/Leaderboard';
import ExecutionFlow from '@/components/ExecutionFlow';
import { useSynapseStore } from '@/store/useSynapseStore';

export default function Home() {
  useEffect(() => {
    useSynapseStore.getState().initSocket();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)_300px]">
        <AgentSidebar />
        <DebateFeed />
        <Leaderboard />
      </div>
      <ExecutionFlow />
    </div>
  );
}
