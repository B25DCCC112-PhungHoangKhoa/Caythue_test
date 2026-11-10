import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Clock,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import type { IBankInfo } from '../../types';

export interface VietQRPaymentCardProps {
  orderCode: string;
  transferCode?: string;
  transferMessage?: string;
  totalPrice: number;
  qrUrl?: string;
  bankInfo?: IBankInfo;
  orderId?: string;
  onComplete?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const VietQRPaymentCard: React.FC<VietQRPaymentCardProps> = ({
  orderCode,
  transferCode,
  transferMessage: initialTransferMsg,
  totalPrice,
  qrUrl: initialQrUrl,
  bankInfo,
  orderId,
  onComplete,
  onClose,
  isModal = false,
}) => {
  const navigate = useNavigate();

  // Bank config defaults
  const bankName = bankInfo?.bankName || 'BIDV';
  const accountHolder = bankInfo?.accountHolder || 'NGUYEN TUAN VINH';
  const accountNumber = bankInfo?.accountNumber || '1210512384';
  const branch = bankInfo?.branch || 'Thành phố Lào Cai';

  // Resolved transfer code & message
  const resolvedCode =
    transferCode ||
    (orderCode.startsWith('CT') ? orderCode.slice(2).toLowerCase() : orderCode.toLowerCase());
  const transferMessage = initialTransferMsg || `NAP ${resolvedCode}`;

  // Fallback QR URL with compact2 template
  const qrUrl =
    initialQrUrl ||
    `https://img.vietqr.io/image/970418-${accountNumber}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(
      transferMessage
    )}&accountName=${encodeURIComponent(accountHolder)}`;

  // Countdown timer state: 10 minutes (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Copy states
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setTimeLeft(600);
    setIsExpired(false);
  };

  const handleCopy = (text: string, type: 'account' | 'message' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'message') {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg text-slate-900 overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="h-1.5 w-full bg-orange-500" />

      {/* Card Header: "Thanh toán bằng chuyển khoản" */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Thanh toán bằng chuyển khoản
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-semibold text-slate-600">
              Tổng tiền:{' '}
              <strong className="text-orange-600 font-mono font-bold text-base sm:text-lg">
                {totalPrice.toLocaleString('vi-VN')}đ
              </strong>
            </span>
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-sm px-2.5 py-1 rounded-lg border ${
                isExpired
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-orange-50 border-orange-200 text-orange-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 active:bg-slate-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Grid: Left Column VietQR Image, Right Column Instructions */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: VietQR Image */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200 max-w-[280px] w-full relative">
            <img
              src={qrUrl}
              alt={`Mã VietQR ${orderCode}`}
              className="w-full h-auto object-contain rounded-lg"
            />
            {isExpired && (
              <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <p className="text-xs font-bold text-slate-900 mb-2">Hết thời gian thanh toán</p>
                <button
                  onClick={handleResetTimer}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow focus-visible:outline-2 focus-visible:outline-orange-500"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Làm mới mã
                </button>
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Mã QR chuẩn Napas 247 & VietQR
          </span>
        </div>

        {/* Right Column: Step-by-step instructions */}
        <div className="md:col-span-7 space-y-4 text-xs sm:text-sm">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-200 pb-2">
            Thực hiện theo hướng dẫn sau để thanh toán:
          </h3>

          <div className="space-y-2.5 leading-relaxed text-slate-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">Bước 1:</span>
              <span>Mở ứng dụng Mobile Banking của ngân hàng bất kỳ</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">Bước 2:</span>
              <span>Chọn “Thanh toán” và quét mã QR tại hướng dẫn này</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">Bước 3:</span>
                <div>
                  <span>Nhập số tiền cần chuyển là </span>
                  <span className="inline-flex items-center gap-1">
                    <strong className="text-orange-600 font-mono font-bold">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(totalPrice), 'amount')}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Sao chép số tiền"
                    >
                      {copiedAmount ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                  <span> và nội dung chuyển tiền </span>
                  <span className="inline-flex items-center gap-1 my-1">
                    <strong className="text-orange-600 font-mono font-bold text-sm bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {transferMessage}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferMessage, 'message')}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Sao chép nội dung chuyển tiền"
                    >
                      {copiedMessage ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>{' '}
                  <span className="text-xs text-slate-500 block sm:inline">
                    (NAP + cách + mã thanh toán)
                  </span>
                </div>
              </div>

              {/* Bank Metadata Table / Box */}
              <div className="ml-0 sm:ml-5 mt-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">{bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tên chủ TK:</span>
                  <span className="font-bold text-slate-900">{accountHolder}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{accountNumber}</span>
                    <button
                      onClick={() => handleCopy(accountNumber, 'account')}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 active:bg-slate-300 disabled:opacity-50"
                      title="Sao chép STK"
                    >
                      {copiedAccount ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Chi nhánh:</span>
                  <span className="text-slate-700 font-medium">{branch}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">Bước 4:</span>
              <span>
                Hoàn thành các bước thanh toán theo hướng dẫn và đợi hệ thống xử lý trong giây lát.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Tự động kiểm tra giao dịch mỗi 5 giây</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onClose && isModal && (
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 active:bg-slate-200 disabled:opacity-50"
            >
              Đóng
            </button>
          )}

          <button
            onClick={handleFinish}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            <span>Xem chi tiết đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VietQRPaymentCard;
