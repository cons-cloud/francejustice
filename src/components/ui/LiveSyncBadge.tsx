import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LiveSyncBadgeProps {
  status?: 'connected' | 'syncing' | 'disconnected';
  className?: string;
  showText?: boolean;
}

export const LiveSyncBadge: React.FC<LiveSyncBadgeProps> = ({
  status = 'connected',
  className = '',
  showText = true,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-300 ${
        status === 'connected'
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
          : status === 'syncing'
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-700'
          : 'bg-rose-500/15 border-rose-500/30 text-rose-700'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        )}
        {status === 'syncing' && (
          <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" />
        )}
        {status === 'disconnected' && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        )}
      </span>

      {showText && (
        <span className="tracking-wide uppercase text-[10px] font-bold">
          {status === 'connected' && '100% En Direct'}
          {status === 'syncing' && 'Synchro…'}
          {status === 'disconnected' && 'Hors Ligne'}
        </span>
      )}
    </div>
  );
};

export default LiveSyncBadge;
