import React, { useState } from 'react';
import { Download, HelpCircle, X, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
        title="Install STBB Books App on your device"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 transition-all cursor-pointer font-medium ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
          }`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                    STBB
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <span className="inline-block px-1.5 py-0.5 bg-slate-200 rounded text-xs">⎋</span> at the bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <p>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <p>
                    Tap <strong>Add</strong> in the top right corner. You can now launch STBB Books offline anytime!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white py-2.5 text-sm font-semibold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
