import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Extend window to include JitsiMeetExternalAPI
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetingProps {
  /** Unique classroom ID → becomes the private room name */
  roomId: string;
  /** User's display name shown to other participants */
  displayName: string;
  /** User's email (shown in participant list) */
  email: string;
  /** Avatar URL for the user */
  avatarUrl?: string;
  /** Called when the user leaves the meeting */
  onLeave: () => void;
  /** Whether the current user is the host (lawyer) */
  isHost?: boolean;
}

// 8x8 JaaS domain — no 5-minute limit, supports 2-hour sessions via JWT exp
const JITSI_DOMAIN = '8x8.vc';

/** Fetch a signed JaaS JWT from the Django backend. Returns null on failure. */
async function fetchJaasToken(
  roomId: string,
  isHost: boolean,
  displayName: string,
  email: string,
): Promise<{ token: string; roomName: string; domain: string } | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) return null;

    const res = await fetch('/api/classrooms/jitsi-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ room_id: roomId, is_host: isHost, display_name: displayName, email }),
    });

    if (!res.ok) {
      console.error('JaaS token fetch failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return { token: data.token, roomName: data.room_name, domain: data.domain };
  } catch (err) {
    console.error('JaaS token fetch error:', err);
    return null;
  }
}

const JitsiMeeting: React.FC<JitsiMeetingProps> = ({
  roomId,
  displayName,
  email,
  avatarUrl,
  onLeave,
  isHost = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const [tokenState, setTokenState] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    /** Load the Jitsi IFrame API script */
    const loadScript = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi script'));
        document.head.appendChild(script);
      });

    const start = async () => {
      // 1. Get signed JWT from backend (2-hour expiry)
      const jaas = await fetchJaasToken(roomId, isHost, displayName, email);
      if (cancelled) return;

      if (!jaas) {
        setErrorMsg(
          'Impossible d\'obtenir un token de réunion. Vérifiez que le serveur est démarré et que vous êtes connecté.',
        );
        setTokenState('error');
        return;
      }

      // 2. Load script
      try {
        await loadScript();
      } catch {
        if (!cancelled) {
          setErrorMsg('Impossible de charger le script Jitsi.');
          setTokenState('error');
        }
        return;
      }
      if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;

      setTokenState('ready');

      // 3. Init JitsiMeetExternalAPI on 8x8.vc with signed JWT
      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: jaas.roomName,      // format: vpaas-magic-cookie-<appid>/<room>
        jwt: jaas.token,              // RS256-signed JaaS JWT (2h expiry)
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',

        // Pre-fill user info so participants see real names
        userInfo: {
          displayName,
          email,
          ...(avatarUrl ? { avatarUrl } : {}),
        },

        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableClosePage: false,
          disableDeepLinking: true,
          disableInviteFunctions: !isHost,
          subject: 'Classe Juridique',
          defaultLanguage: 'fr',
          analytics: { disabled: true },
          enableLayerSuspension: true,
          p2p: { enabled: true },
          fileRecordingsEnabled: false,
          liveStreamingEnabled: false,
          // No lobby needed — JaaS JWT controls access
          enableLobbyChat: false,
          hideLobbyButton: true,
          requireDisplayName: false,
          lobby: { autoKnock: false, enableChat: false },
          // Moderate video resolution
          constraints: {
            video: {
              height: { ideal: 480, max: 720, min: 180 },
              width: { ideal: 640, max: 1280, min: 320 },
              frameRate: { max: 30 },
            },
          },
        },

        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'raisehand', 'videoquality', 'filmstrip',
            'tileview', 'select-background', 'help',
            'mute-everyone', 'security',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_FOOTER: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DEFAULT_BACKGROUND: '#1a1b1e',
          DEFAULT_LOCAL_DISPLAY_NAME: displayName,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          LANG_DETECTION: false,
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
        },
      });

      // 4. Event listeners
      apiRef.current.addEventListeners({
        videoConferenceJoined: () => {
          // Host: disable any residual lobby mode
          if (isHost) {
            try { apiRef.current?.executeCommand('toggleLobby', false); } catch { /* noop */ }
          }
        },

        // Auto-admit any participant knocking (should not happen with JaaS JWT)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participantKnocking: (event: any) => {
          if (isHost && event?.participantId) {
            try { apiRef.current?.executeCommand('admitParticipant', event.participantId); } catch { /* noop */ }
          }
        },

        videoConferenceLeft: () => onLeave(),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorOccurred: (event: { error: { name: string } }) => {
          console.error('Jitsi error:', event.error);
        },
      });
    };

    start();

    return () => {
      cancelled = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomId, displayName, email, avatarUrl, onLeave, isHost]);

  // --- Loading / Error overlays ---
  if (tokenState === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1b1e] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-slate-300 text-sm font-medium">Connexion à la salle de réunion…</p>
      </div>
    );
  }

  if (tokenState === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1b1e] flex flex-col items-center justify-center gap-5 text-white p-8 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold">Connexion impossible</h2>
        <p className="text-slate-400 max-w-sm leading-relaxed text-sm">{errorMsg}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={onLeave}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1b1e]">
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default JitsiMeeting;
