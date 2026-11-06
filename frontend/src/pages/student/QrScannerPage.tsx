import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  AlertCircle, 
  Bike, 
  MapPin, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  ArrowRight, 
  Keyboard, 
  X,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../services/api';

export const QrScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Bicycle identification state
  const [identifiedBike, setIdentifiedBike] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'START' | 'RETURN' | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(12.50);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Process scanned text (URL or direct code)
  const handleDecodedText = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setActionError(null);
    setLoading(true);

    try {
      // If full URL was scanned (e.g. http://.../scan/cyc_tok_xxx), extract token
      let tokenOrCode = decodedText.trim();
      if (tokenOrCode.includes('/scan/')) {
        const parts = tokenOrCode.split('/scan/');
        tokenOrCode = parts[parts.length - 1];
      }

      const res = await api.get(`/bicycles/identify/${encodeURIComponent(tokenOrCode)}`);
      if (res.data.success) {
        setIdentifiedBike(res.data.bicycle);
        setActionType(res.data.action);
        setHourlyRate(res.data.hourlyRate || 12.50);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Could not identify bicycle from "${decodedText}". Please verify the QR code or code.`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  useEffect(() => {
    // If URL has path param /scan/:token, auto-identify
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'scan' && pathParts[2]) {
      handleDecodedText(pathParts[2]);
    }

    // Initialize HTML5 QR Code Scanner
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        (error) => {
          // Scanner frame error, normal when searching for QR code
        }
      );

      scannerRef.current = scanner;
    } catch (err: any) {
      console.warn('QR camera initialization issue:', err);
      setCameraError('Camera access unavailable. Please use the manual code entry below.');
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedText(manualCode.trim());
  };

  // Execute Start Rental
  const handleConfirmStart = async () => {
    if (!identifiedBike) return;
    setLoading(true);
    setActionError(null);

    try {
      const res = await api.post('/rentals/start', {
        qrTokenOrCode: identifiedBike.qrToken || identifiedBike.bicycleCode
      });

      if (res.data.success) {
        navigate('/student/active-rental');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to start bicycle rental.');
    } finally {
      setLoading(false);
    }
  };

  // Execute Return Rental
  const handleConfirmReturn = async () => {
    if (!identifiedBike) return;
    setLoading(true);
    setActionError(null);

    try {
      const res = await api.post('/rentals/return', {
        qrTokenOrCode: identifiedBike.qrToken || identifiedBike.bicycleCode
      });

      if (res.data.success) {
        navigate(`/student/rental-summary/${res.data.summary.rentalId}`, {
          state: { summary: res.data.summary }
        });
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to return bicycle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scan Campus Bicycle</h1>
        <p className="text-sm text-slate-500 mt-1">
          Scan the QR code on any available bicycle to start or end your rental
        </p>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-800 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold">Scan Error:</strong> {actionError}
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square max-w-[340px] mx-auto flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full"></div>
          
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
              <Camera className="w-12 h-12 text-slate-500 mb-3" />
              <div className="text-sm font-semibold">{cameraError}</div>
              <div className="text-xs text-slate-400 mt-1">
                You can enter the bicycle code manually below.
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-campus-600" />
          <span>Point camera at the QR code tag located on the bicycle handlebar</span>
        </p>
      </div>

      {/* Manual Entry Fallback */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">Manual Bicycle Code Fallback</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Can't scan the QR code? Type the bicycle code engraved on the frame (e.g., <strong className="text-slate-700">CYC-001</strong>).
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="CYC-001"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-campus-500 text-sm uppercase font-mono font-semibold"
          />
          <button
            type="submit"
            disabled={loading || !manualCode.trim()}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            Identify
          </button>
        </form>

        {/* Quick demo buttons for testing */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Test Bicycles:</span>
          {['CYC-001', 'CYC-002', 'CYC-003', 'CYC-004'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setManualCode(code);
                handleDecodedText(code);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Bicycle Identification & Action Confirmation Modal / Card */}
      {identifiedBike && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bike className="w-6 h-6 text-campus-600" />
                <h3 className="text-lg font-extrabold text-slate-900">Bicycle Identified</h3>
              </div>
              <button
                onClick={() => setIdentifiedBike(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Code</span>
                <span className="text-xl font-extrabold text-campus-700 font-mono">{identifiedBike.bicycleCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Model</span>
                <span className="font-semibold text-slate-800">{identifiedBike.model}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Station / Hub</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {identifiedBike.location}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Rental Rate</span>
                <span className="font-bold text-slate-900">₹{hourlyRate.toFixed(2)} / hour</span>
              </div>
            </div>

            {/* Action buttons */}
            {actionType === 'START' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmStart}
                  disabled={loading}
                  className="w-full py-3.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl font-bold shadow-lg shadow-campus-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Starting Rental...' : (
                    <>
                      <span>Unlock & Start Rental</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Authoritative rental timer begins immediately upon confirmation.
                </p>
              </div>
            ) : actionType === 'RETURN' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Calculating Duration & Bill...' : (
                    <>
                      <span>Confirm Return & Calculate Bill</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Ending ride for {identifiedBike.bicycleCode}. You will receive your final invoice.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
