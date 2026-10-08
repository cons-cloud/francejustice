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
    role?: string;
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

export const ADMIN_EMAILS = ['justlaw@gmail.com', 'francejustice@gmail.com'];

export const isUserAdmin = (email?: string | null, currentRole?: string | null): boolean => {
  if (currentRole === 'admin') return true;
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  useEffect(() => {
    const purgeStaleAuth = () => {
      try {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        if (typeof window !== 'undefined') {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
              localStorage.removeItem(k);
            }
          }
          localStorage.removeItem('role');
        }
      } catch (_e) {}
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (
          error.message?.includes('Refresh Token') || 
          error.message?.includes('refresh_token_not_found') ||
          (error as any).status === 400
        ) {
          console.warn('[useAuth] Jeton de session expiré ou invalide - réinitialisation propre');
          purgeStaleAuth();
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }
      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const email = currentSession.user.email?.toLowerCase().trim();
        const isAdmin = isUserAdmin(email);
        if (isAdmin) {
          setRole('admin');
          localStorage.setItem('role', 'admin');
        }
        fetchProfile(currentSession.user.id, email);
      } else {
        setRole(null);
        setProfile(null);
        localStorage.removeItem('role');
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Supabase getSession failed/timed out:', err);
      if (
        err?.message?.includes('Refresh Token') ||
        err?.message?.includes('refresh_token_not_found') ||
        err?.status === 400
      ) {
        purgeStaleAuth();
      }
      setSession(null);
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        localStorage.removeItem('role');
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const email = session.user.email?.toLowerCase().trim();
        const isAdmin = isUserAdmin(email);
        if (isAdmin) {
          setRole('admin');
          localStorage.setItem('role', 'admin');
        }
        fetchProfile(session.user.id, email);
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
          const email = (user?.email || session?.user?.email || '').toLowerCase().trim();
          const isAdmin = isUserAdmin(email);
          const effectiveRole = isAdmin ? 'admin' : (updated.role || 'user');
          setRole(effectiveRole);
          setProfile({
            role: effectiveRole,
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
          localStorage.setItem('role', effectiveRole);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user, session]);

  const fetchProfile = async (userId: string, userEmail?: string | null) => {
    const email = (userEmail || user?.email || session?.user?.email || '').toLowerCase().trim();
    const isAdmin = isUserAdmin(email);

    const { data, error } = await supabase
      .from('profiles_just')
      .select('role, first_name, last_name, is_verified, avatar_url, phone, city, postal_code, birth_date, bio, specialty, bar_number, experience_years, is_available, stripe_public_key, stripe_secret_key')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      const effectiveRole = isAdmin ? 'admin' : (data.role || 'user');

      // Sync admin status back to profiles_just if stale
      if (isAdmin && data.role !== 'admin') {
        supabase.from('profiles_just').update({ role: 'admin' }).eq('id', userId).then();
      }

      setRole(effectiveRole);
      setProfile({
        role: effectiveRole,
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        is_verified: true,
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
      localStorage.setItem('role', effectiveRole);
    } else {
      // Auto-provision profile from OAuth metadata (e.g. Google Sign-In)
      const currentUser = (await supabase.auth.getUser()).data.user || session?.user || user;
      if (currentUser && currentUser.id === userId) {
        const meta = currentUser.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = meta.given_name || nameParts[0] || 'Utilisateur';
        const lastName = meta.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Google');
        const avatarUrl = meta.avatar_url || meta.picture || '';

        // Check if user initiated OAuth with an intended role
        const targetRole = typeof window !== 'undefined' ? sessionStorage.getItem('target_oauth_role') : null;
        const safeRole = isAdmin
          ? 'admin'
          : (targetRole && ['lawyer', 'student', 'professor', 'doctorate', 'user'].includes(targetRole)
            ? targetRole
            : 'pending_selection');

        const newProfile = {
          id: userId,
          email: currentUser.email || email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
          role: safeRole,
          is_verified: true
        };

        try {
          await supabase.from('profiles_just').upsert([newProfile]);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('target_oauth_role');
          }
        } catch (e) {
          console.warn('Auto-provisioning profile notice:', e);
        }

        setRole(safeRole);
        setProfile({
          role: safeRole,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
          is_verified: true
        });
        localStorage.setItem('role', safeRole);
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut error/warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      localStorage.removeItem('role');
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('auth-token') || key === 'role')) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore
      }
    }
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
