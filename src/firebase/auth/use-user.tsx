
'use client';

import { useState, useEffect } from 'react';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';

export function useUser(auth: Auth | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // If auth is not provided yet, we remain in loading state
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
