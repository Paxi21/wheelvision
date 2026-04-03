'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

interface UserData {
  email: string;
  full_name: string;
  credits: number;
}

interface AuthContextType {
  session: Session | null;
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  const fetchUserData = async (email: string) => {
    console.log('[Auth] Fetching user data for:', email);
    const { data, error } = await supabase
      .from('users')
      .select('email, full_name, credits')
      .eq('email', email)
      .maybeSingle();
    console.log('[Auth] User data:', data, 'error:', error);
    setUser(data ?? null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      await fetchUserData(session.user.email);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session?.user?.email ?? 'none');
      setSession(session);
      if (session?.user?.email) {
        fetchUserData(session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Single auth state listener for the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, '| User:', session?.user?.email ?? 'none');
      setSession(session);
      if (session?.user?.email) {
        fetchUserData(session.user.email);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
