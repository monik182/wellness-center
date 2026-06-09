import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    if (useManual) return;

    const reader = new BrowserMultiFormatReader();
    let mounted = true;

    const startScanning = async () => {
      try {
        if (!videoRef.current) return;

        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;

        reader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result && mounted) {
            const code = result.getText();
            navigator.vibrate?.(100);
            onScan(code);
            stream.getTracks().forEach((track) => track.stop());
          }
          if (error && !(error.name === "NotFoundException")) {
            console.debug("Scan error:", error);
          }
        });
      } catch (e) {
        if (mounted) {
          setError(
            e instanceof Error && e.name === "NotAllowedError"
              ? "Se denegó el acceso a la cámara"
              : "Error al acceder a la cámara"
          );
          setUseManual(true);
        }
      }
    };

    startScanning();

    return () => {
      mounted = false;
      reader.reset();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [useManual, onScan]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900">
        <h2 className="text-white font-medium">Escanear código de barras</h2>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white p-1"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {!useManual ? (
          <>
            {/* Video feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-green-400 rounded-lg shadow-lg" />
              <div className="absolute inset-0 bg-black opacity-40 pointer-events-none" style={{
                boxShadow: "inset 0 0 0 9999px rgba(0, 0, 0, 0.4)"
              }} />
            </div>

            {/* Error or manual fallback */}
            {error && (
              <div className="absolute bottom-8 left-4 right-4 bg-red-600 text-white p-4 rounded">
                <p className="mb-2">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setUseManual(true);
                  }}
                  className="bg-white text-red-600 px-4 py-2 rounded font-medium"
                >
                  Ingresar código manualmente
                </button>
              </div>
            )}

            {/* Manual input toggle */}
            {!error && (
              <button
                onClick={() => setUseManual(true)}
                className="absolute bottom-8 left-4 right-4 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium"
              >
                Ingresar código manualmente
              </button>
            )}
          </>
        ) : (
          /* Manual input mode */
          <div className="w-full max-w-xs px-6 py-8 flex flex-col gap-4">
            <label className="text-white text-center">
              <p className="mb-2">Ingresa el código de barras:</p>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="Ej: 8410032002651"
                className="w-full px-4 py-2 rounded bg-white text-black"
                autoFocus
              />
            </label>
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setUseManual(false);
                setManualCode("");
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium"
            >
              Usar cámara
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
