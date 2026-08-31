import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTranslation } from '../../i18n';

interface ChatProps {
  roomId: string;
  currentUserId: string;
  recipientName?: string;
  isAdmin?: boolean;
}

export const Chat: React.FC<ChatProps> = ({ roomId, currentUserId, recipientName, isAdmin }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const sub = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages_just', 
        filter: `room_id=eq.${roomId}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages_just')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isAdmin) return;

    const { error } = await supabase.from('chat_messages_just').insert([{
      room_id: roomId,
      sender_id: currentUserId,
      content: newMessage
    }]);

    if (!error) setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden text-slate-100">
      <div className="p-4 border-b border-slate-800 bg-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-900/60 border border-primary-700/50 rounded-full flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-primary-400" />
          </div>
          <span className="font-bold text-white">{recipientName || t('chat.discussion', 'Discussion')}</span>
        </div>
        {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950"
      >
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.sender_id === currentUserId 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none shadow-sm'
            }`}>
              {m.content}
              <p className={`text-[10px] mt-1 ${m.sender_id === currentUserId ? 'text-primary-100' : 'text-slate-400'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <p className="text-sm italic">{t('chat.empty', 'Aucun message pour le moment.')}</p>
          </div>
        )}
      </div>

      {!isAdmin && (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder', 'Écrivez votre message...')}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {isAdmin && (
        <div className="p-4 border-t bg-yellow-500/10 border-yellow-500/20 text-[10px] text-yellow-400 italic text-center">
          {t('chat.admin_mode', 'Mode Observation Admin - Envoi de messages désactivé')}
        </div>
      )}
    </div>
  );
};
