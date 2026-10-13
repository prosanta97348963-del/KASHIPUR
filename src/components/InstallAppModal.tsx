import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, X, Sparkles, Share2, ArrowRight } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  triggerInstall: () => Promise<boolean>;
  isInstalled: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  triggerInstall,
  isInstalled,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await triggerInstall();
      if (res) {
        onClose();
        return;
      }
    }
  };

  const handleDownloadOfflineShortcut = () => {
    setDownloading(true);
    // Create an offline launcher HTML file with app metadata
    const appUrl = window.location.origin;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>A.R SELLS App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=${appUrl}">
  <style>
    body { font-family: sans-serif; background: #064e3b; color: white; text-align: center; padding: 40px 20px; }
    .card { background: white; color: #111; padding: 24px; border-radius: 16px; max-width: 320px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    a { display: inline-block; background: #059669; color: white; padding: 14px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>A.R SELLS</h2>
    <p>Opening Sales Order App...</p>
    <a href="${appUrl}">Launch A.R SELLS</a>
  </div>
  <script>window.location.href = "${appUrl}";</script>
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AR_SELLS_App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-black shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Install A.R SELLS on Phone</h3>
              <p className="text-xs text-emerald-200">Android APK / Home Screen App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status or Success alert */}
          {isInstalled ? (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>A.R SELLS is already installed on this device!</span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Install directly onto your Android Phone</span>
                <span className="text-[11px] text-emerald-800">
                  Runs full-screen with offline support so sales boys can take orders anywhere.
                </span>
              </div>
            </div>
          )}

          {/* Action 1: Direct WebAPK Install button (if browser prompt is ready) */}
          {isInstallable && !isInstalled && (
            <div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>1-Tap Install A.R SELLS App</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* Action 2: Download App File / Launcher */}
          <div>
            <button
              type="button"
              onClick={handleDownloadOfflineShortcut}
              disabled={downloading}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing File...' : 'Download Phone App File'}</span>
            </button>
            {downloadSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold text-center mt-1.5 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                File downloaded! Tap to open and add to home screen.
              </p>
            )}
          </div>

          {/* Step-by-Step Android Browser Guide */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-2">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
              How to Install in 2 Steps on Android:
            </h4>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  Tap the <b>three dots menu (⋮)</b> at top right of Chrome or your browser.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Tap <b>"Install app"</b> or <b>"Add to Home screen"</b>.
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
              The <b>A.R SELLS</b> app icon will immediately appear on your phone home screen just like an APK file from Play Store!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
