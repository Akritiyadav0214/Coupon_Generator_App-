import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Upload,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '../../services/couponService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import { extractErrorMessage, formatDate, formatDateTime } from '../../utils/formatters';

export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastScannedRef = useRef('');

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const verifyPayload = useCallback(async (payloadString) => {
    if (!payloadString || !payloadString.trim()) return;
    try {
      setVerifying(true);
      const data = await couponService.verifyCoupon({ qrData: payloadString.trim() });
      setResult(data);
      if (data.verificationStatus === 'VALID') {
        toast.success('Valid active coupon verified');
      } else if (data.verificationStatus === 'ALREADY_REDEEMED') {
        toast.error('Warning: Coupon already redeemed');
      } else {
        toast.error(data.message || 'Coupon invalid or expired');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Verification request failed'));
    } finally {
      setVerifying(false);
    }
  }, []);

  const scanFrameRef = useRef(null);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code?.data && code.data !== lastScannedRef.current) {
        lastScannedRef.current = code.data;
        stopCamera();
        verifyPayload(code.data);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
  }, [stopCamera, verifyPayload]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = async () => {
    setCameraError('');
    lastScannedRef.current = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Use manual entry or QR image upload.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      }, 60);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings or use manual lookup.'
          : 'Unable to access camera device. Use QR image upload or manual Coupon ID lookup.'
      );
      stopCamera();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          verifyPayload(code.data);
        } else {
          toast.error('No QR code detected in the uploaded image.');
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Enter a Coupon ID or QR payload');
      return;
    }
    verifyPayload(manualInput.trim());
  };

  const handleConfirmRedemption = async () => {
    if (!result?.coupon) return;
    try {
      setRedeeming(true);
      const res = await couponService.redeemCoupon({
        couponId: result.coupon.couponId,
        verificationToken: result.coupon.verificationToken,
      });
      toast.success(`Coupon ${res.data.coupon.couponId} redeemed!`);
      setResult({
        valid: false,
        verificationStatus: 'REDEEMED_NOW',
        message: 'Coupon successfully redeemed and locked against reuse.',
        coupon: res.data.coupon,
      });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Redemption failed');
      toast.error(msg);
      await verifyPayload(result.coupon.couponId);
    } finally {
      setRedeeming(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setManualInput('');
    lastScannedRef.current = '';
  };

  const coupon = result?.coupon;
  const vStatus = result?.verificationStatus;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">QR Coupon Scanner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scan student QR passes via camera, upload a QR image, or look up a Coupon ID directly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Scanner + Lookup Controls */}
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Camera &amp; Input Verification
            </h2>
            <div className="flex gap-2">
              {cameraActive ? (
                <Button variant="danger" size="sm" onClick={stopCamera}>
                  <CameraOff className="h-4 w-4" />
                  Stop Camera
                </Button>
              ) : (
                <Button size="sm" onClick={startCamera}>
                  <Camera className="h-4 w-4" />
                  Start Camera Scan
                </Button>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                Upload QR
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {cameraError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {cameraError}
            </div>
          )}

          {/* Camera Viewport */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
                </div>
                <span className="absolute bottom-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-emerald-300">
                  Point camera at student QR coupon...
                </span>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <Camera className="mx-auto mb-2 h-9 w-9 text-slate-500" />
                <p className="text-sm font-medium text-slate-200">Camera scanner idle</p>
                <p className="mt-1 text-xs text-slate-400">
                  Click &ldquo;Start Camera Scan&rdquo; or enter a Coupon ID below.
                </p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* Manual Lookup Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-700">
              Manual Coupon ID or Token Verification
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. MM-20261125-A8F3K2 or QR JSON"
                  className="font-mono-code w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <Button type="submit" loading={verifying} variant="dark">
                Verify
              </Button>
            </div>
          </form>
        </Card>

        {/* Right: Verification Result Panel */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Verification Result
              </h2>
              {result && (
                <button
                  type="button"
                  onClick={resetScanner}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            {!result ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShieldCheck className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Awaiting coupon scan</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Every QR scan is verified server-side against MongoDB before redemption is
                  permitted.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Status Banner */}
                {vStatus === 'VALID' && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
                    <div>
                      <p className="text-sm font-bold">VALID COUPON</p>
                      <p className="mt-0.5 text-xs text-emerald-800">{result.message}</p>
                    </div>
                  </div>
                )}

                {vStatus === 'REDEEMED_NOW' && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-[#064E3B] p-4 text-white">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm font-bold">REDEMPTION CONFIRMED</p>
                      <p className="mt-0.5 text-xs text-emerald-100">{result.message}</p>
                    </div>
                  </div>
                )}

                {vStatus === 'ALREADY_REDEEMED' && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold">ALREADY REDEEMED</p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        {result.message}
                        {coupon?.redeemedAt && ` Redeemed at ${formatDateTime(coupon.redeemedAt)}.`}
                      </p>
                    </div>
                  </div>
                )}

                {(vStatus === 'EXPIRED' || vStatus === 'INVALID') && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold">{vStatus} COUPON</p>
                      <p className="mt-0.5 text-xs text-red-800">{result.message}</p>
                    </div>
                  </div>
                )}

                {/* Coupon & Student Details */}
                {coupon && (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 text-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500">Coupon ID</span>
                      <span className="font-mono-code text-xs font-bold text-slate-900">
                        {coupon.couponId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500">Student Name</span>
                      <span className="text-xs font-semibold text-slate-900">
                        {coupon.student?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500">Student ID</span>
                      <span className="font-mono-code text-xs font-semibold text-slate-800">
                        {coupon.student?.studentId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500">Meal &amp; Date</span>
                      <span className="text-xs font-medium text-slate-800">
                        {coupon.mealType} &bull; {formatDate(coupon.couponDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-slate-500">Current Status</span>
                      <StatusBadge status={coupon.status} />
                    </div>
                    {coupon.redeemedAt && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-slate-500">Redeemed At</span>
                        <span className="text-xs font-medium text-slate-800">
                          {formatDateTime(coupon.redeemedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {vStatus === 'VALID' && coupon && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <Button
                size="lg"
                className="w-full"
                loading={redeeming}
                onClick={handleConfirmRedemption}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Meal Redemption
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
