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
    phone?: string;
    city?: string;
    postal_code?: string;
    birth_date?: string;
    bio?: string;
    specialty?: string;
    bar_number?: string;
    experience_years?: number;
    is_available?: boolean;
    stripe_public_key?: string;
    stripe_secret_key?: string;
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

  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles_just',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const updated = payload.new as any;
          setRole(updated.role);
          setProfile({
            first_name: updated.first_name,
            last_name: updated.last_name,
            avatar_url: updated.avatar_url,
            is_verified: updated.is_verified,
            phone: updated.phone,
            city: updated.city,
            postal_code: updated.postal_code,
            birth_date: updated.birth_date,
            bio: updated.bio,
            specialty: updated.specialty,
            bar_number: updated.bar_number,
            experience_years: updated.experience_years,
            is_available: updated.is_available,
            stripe_public_key: updated.stripe_public_key,
            stripe_secret_key: updated.stripe_secret_key
          });
          localStorage.setItem('role', updated.role);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles_just')
        .select('role, first_name, last_name, is_verified, avatar_url, phone, city, postal_code, birth_date, bio, specialty, bar_number, experience_years, is_available, stripe_public_key, stripe_secret_key')
        .eq('id', userId)
        .maybeSingle();

    if (data && !error) {
      setRole(data.role);
      setProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        is_verified: data.is_verified,
        phone: data.phone,
        city: data.city,
        postal_code: data.postal_code,
        birth_date: data.birth_date,
        bio: data.bio,
        specialty: data.specialty,
        bar_number: data.bar_number,
        experience_years: data.experience_years,
        is_available: data.is_available,
        stripe_public_key: data.stripe_public_key,
        stripe_secret_key: data.stripe_secret_key
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
