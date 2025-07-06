
import React, { useEffect } from 'react';
import { PageLayout } from '@/components/common';
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
    <PageLayout
      title="Dashboard"
      description="Monitor your systems, services, and infrastructure"
    >
      <div className="space-y-10">
        <GitlabSection />
        <DnsSection />
        <UptimeSection />
        <ServerSection />
      </div>
    </PageLayout>
  );
};

export default Index;
