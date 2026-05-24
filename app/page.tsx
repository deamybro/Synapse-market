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
    <div className="flex flex-col h-screen bg-black text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <AgentSidebar />
        <DebateFeed />
        <Leaderboard />
      </div>
      <ExecutionFlow />
    </div>
  );
}
