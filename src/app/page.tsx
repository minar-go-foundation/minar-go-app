
"use client";

import { useUser } from "@/firebase";
import AuthScreen from "@/components/auth-screen";
import DashboardScreen from "@/components/dashboard-screen";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {!user ? (
        <AuthScreen />
      ) : (
        <DashboardScreen user={user} />
      )}
      <Toaster />
    </main>
  );
}
