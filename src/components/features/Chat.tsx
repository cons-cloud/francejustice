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
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-900">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-cyan-50 border border-cyan-200 rounded-full flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-cyan-600" />
          </div>
          <span className="font-bold text-slate-900">{recipientName || t('chat.discussion', 'Discussion')}</span>
        </div>
        {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60"
      >
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm ${
              m.sender_id === currentUserId 
                ? 'bg-cyan-600 text-white rounded-tr-none shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
            }`}>
              <p className="leading-relaxed">{m.content}</p>
              <p className={`text-[10px] mt-1 font-medium ${m.sender_id === currentUserId ? 'text-cyan-100' : 'text-slate-400'}`}>
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
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder', 'Écrivez votre message...')}
            className="flex-1 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500"
          />
          <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {isAdmin && (
        <div className="p-4 border-t bg-amber-50 border-amber-200 text-[10px] text-amber-800 italic text-center font-medium">
          {t('chat.admin_mode', 'Mode Observation Admin - Envoi de messages désactivé')}
        </div>
      )}
    </div>
  );
};
