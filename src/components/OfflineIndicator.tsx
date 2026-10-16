import React from 'react';
import { WifiOff, HardDriveDownload } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500 text-slate-950 font-medium px-4 py-2.5 text-xs sm:text-sm shadow-xl border border-amber-600 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <span>
        <strong>Offline Mode:</strong> Cached app pages and books saved with “Save for Offline” can work without internet. Other PDFs and AI features may need a connection.
      </span>
    </div>
  );
};
