import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'quote' | 'appointment' | 'payment' | 'message' | 'live' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const useNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch initial notifications ────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let notifs: Notification[] = [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      notifs = [...(data as Notification[])];
    }

    // Resilient fallback / merge for notifications_just
    const { data: justData } = await supabase
      .from('notifications_just')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (justData && justData.length > 0) {
      const existingIds = new Set(notifs.map(n => n.id));
      for (const item of justData) {
        if (!existingIds.has(item.id)) {
          notifs.push(item as Notification);
        }
      }
    }

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifs);
    setLoading(false);
  }, [userId]);

  // ── Subscribe to realtime inserts & updates across both tables ─────────────
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications_realtime:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_just',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications_just',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // ── Mark single as read ────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    await Promise.allSettled([
      supabase.from('notifications').update({ is_read: true }).eq('id', notificationId),
      supabase.from('notifications_just').update({ is_read: true }).eq('id', notificationId),
    ]);
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await Promise.allSettled([
      supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false),
      supabase.from('notifications_just').update({ is_read: true }).eq('user_id', userId).eq('is_read', false),
    ]);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
};
