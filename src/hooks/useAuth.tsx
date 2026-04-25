import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  role: string | null;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (session.user.email === 'justlaw@gmail.com') {
          setRole('admin');
          localStorage.setItem('role', 'admin');
        }
        fetchProfile(session.user.id);
      } else {
        setRole(null);
        setProfile(null);
        localStorage.removeItem('role');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, is_verified')
        .eq('id', userId)
        .maybeSingle();

    if (data && !error) {
      setRole(data.role);
      setProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        is_verified: data.is_verified
      });
      localStorage.setItem('role', data.role);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, role, profile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
