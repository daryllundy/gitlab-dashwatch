
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GitlabSection from '@/components/GitlabSection';
import DnsSection from '@/components/DnsSection';
import UptimeSection from '@/components/UptimeSection';
import ServerSection from '@/components/ServerSection';

const Index = () => {
  // Enable dark mode based on user preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-in">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your systems, services, and infrastructure
          </p>
        </div>
        
        <div className="space-y-10">
          <GitlabSection />
          <DnsSection />
          <UptimeSection />
          <ServerSection />
        </div>
      </main>
      
      <footer className="mt-auto py-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground text-center">
            DashWatch — Monitoring your self-hosted infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
