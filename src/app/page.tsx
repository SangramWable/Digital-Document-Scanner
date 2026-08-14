'use client';

import { useAppStore } from '@/lib/store';
import LandingPage from '@/components/docsync/LandingPage';
import AuthDialog from '@/components/docsync/AuthDialog';
import AppShell from '@/components/docsync/AppShell';

export default function Home() {
  const { isAuthenticated, currentView } = useAppStore();

  return (
    <main className="min-h-screen bg-background">
      {!isAuthenticated || currentView === 'landing' ? (
        <LandingPage onGetStarted={() => useAppStore.getState().setShowAuthDialog(true, 'signup')} />
      ) : (
        <AppShell />
      )}
      <AuthDialog />
    </main>
  );
}
