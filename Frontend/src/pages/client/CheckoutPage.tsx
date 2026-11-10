import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Gamepad2,
  Lock,
  Phone,
  Server,
  FileText,
  CreditCard,
  QrCode,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useBookingStore } from '../../store/useBookingStore';
import { VietQRPaymentCard } from '../../components/ui/VietQRPaymentCard';
import type { CreateOrderResponse, PaymentMethod, IBankInfo } from '../../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedGame,
    selectedService,
    startRankTier,
    targetRankTier,
    currentUnit,
    targetUnit,
    quantity,
    options,
    customOptionsSelection,
    pricePreview,
    resetBooking,
  } = useBookingStore();

  const [formData, setFormData] = useState({
    inGameAccount: '',
    inGamePassword: '',
    inGameServer: 'VN',
    inGameName: '',
    contactPhone: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VIETQR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Successfully created order data to display the payment screen
  const [createdOrderData, setCreatedOrderData] = useState<{
    _id: string;
    orderCode: string;
    transferCode?: string;
    transferMessage?: string;
    totalPrice: number;
    qrUrl: string;
    bankInfo?: IBankInfo;
  } | null>(null);

  // 1. If order was created, render the Payment Screen directly
  if (createdOrderData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            onClick={() => resetBooking()}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Danh Sách Đơn Hàng Của Bạn
          </Link>
          <button
            onClick={() => {
              resetBooking();
              navigate('/');
            }}
            className="text-xs text-orange-600 hover:underline font-bold"
          >
            + Đặt Đơn Cày Rank Khác
          </button>
        </div>

        <VietQRPaymentCard
          orderCode={createdOrderData.orderCode}
          transferCode={createdOrderData.transferCode}
          transferMessage={createdOrderData.transferMessage}
          totalPrice={createdOrderData.totalPrice}
          qrUrl={createdOrderData.qrUrl}
          bankInfo={createdOrderData.bankInfo}
          orderId={createdOrderData._id}
          onComplete={() => {
            const targetId = createdOrderData._id;
            resetBooking();
            navigate(`/orders/${targetId}`);
          }}
        />
      </div>
    );
  }

  const serviceType = selectedService?.serviceType || 'RANK_TIER';
  const hasValidConfig =
    Boolean(selectedGame && selectedService && pricePreview) &&
    (serviceType === 'RANK_TIER'
      ? Boolean(startRankTier && targetRankTier)
      : serviceType === 'PER_UNIT'
      ? targetUnit > currentUnit
      : serviceType === 'MATCH_COUNT'
      ? quantity >= 1
      : true);

  // 2. If no booking was selected and no order created, prompt user to pick a game
  if (!selectedGame || !selectedService || !pricePreview || !hasValidConfig) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Chưa Chọn Cấu Hình Dịch Vụ</h2>
          <p className="text-xs text-slate-500">
            Vui lòng chọn tựa game và cấu hình gói dịch vụ trước khi tiến hành thanh toán.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md shadow-orange-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Danh Mục Game
          </Link>
        </div>
      </div>
    );
  }

  // 3. Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.inGameAccount.trim() || !formData.inGamePassword.trim()) {
      setError('Vui lòng điền đầy đủ tài khoản và mật khẩu game!');
      return;
    }

    try {
      setSubmitting(true);
      const selectedCustomOptionsList = Object.entries(customOptionsSelection)
        .filter(([_, val]) => val.selected)
        .map(([k, val]) => ({
          key: k,
          inputValue: val.inputValue,
        }));

      const res = await axiosClient.post<CreateOrderResponse>('/orders', {
        serviceId: selectedService!._id,
        startRankTierId: serviceType === 'RANK_TIER' ? startRankTier?._id : undefined,
        targetRankTierId: serviceType === 'RANK_TIER' ? targetRankTier?._id : undefined,
        currentUnit: serviceType === 'PER_UNIT' ? currentUnit : undefined,
        targetUnit: serviceType === 'PER_UNIT' ? targetUnit : undefined,
        quantity: serviceType === 'MATCH_COUNT' ? quantity : undefined,
        options,
        customOptions: selectedCustomOptionsList,
        accountInfo: {
          inGameAccount: formData.inGameAccount.trim(),
          inGamePassword: formData.inGamePassword,
          inGameServer: formData.inGameServer.trim() || 'VN',
          inGameName: formData.inGameName.trim(),
          contactPhone: formData.contactPhone.trim(),
          note: formData.note.trim(),
        },
        paymentMethod,
      });

      if (res.data.success && res.data.order) {
        setCreatedOrderData(res.data.order);
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb / Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại trang tính giá
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Account & Contact Info Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              Thông Tin Tài Khoản & Bàn Giao
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Thông tin đăng nhập được mã hóa an toàn và chỉ cung cấp cho Booster được giao đơn.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account & Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-orange-600" />
                  Tài Khoản Đăng Nhập Game <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Garena / Riot ID / Tên đăng nhập"
                  value={formData.inGameAccount}
                  onChange={(e) => setFormData({ ...formData, inGameAccount: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-600" />
                  Mật Khẩu Game <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu game"
                  value={formData.inGamePassword}
                  onChange={(e) => setFormData({ ...formData, inGamePassword: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* In-game Name & Server Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên Nhân Vật In-game (IGN)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: YasuoGankTem#VN2"
                  value={formData.inGameName}
                  onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-orange-600" />
                  Máy Chủ (Server)
                </label>
                <input
                  type="text"
                  value={formData.inGameServer}
                  onChange={(e) => setFormData({ ...formData, inGameServer: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Ghi Chú Đơn Hàng (Khung giờ cày, tướng yêu thích, lưu ý...)
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Chỉ cày vào buổi đêm từ 23h đến 6h sáng, ưu tiên tướng tủ..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-3">
                Phương Thức Thanh Toán:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 ${
                    paymentMethod === 'VIETQR'
                      ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs font-bold">Chuyển Khoản VietQR</p>
                    <p className="text-[10px] text-slate-500">Tự động 24/7</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOCK_CARD')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-purple-500 ${
                    paymentMethod === 'MOCK_CARD'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold">Thẻ Ngân Hàng / Thử Nghiệm</p>
                    <p className="text-[10px] text-slate-500">Giả lập thanh toán</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 motion-reduce:transform-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                    <span>Đang khởi tạo đơn hàng…</span>
                  </>
                ) : (
                  <span>Xác nhận tạo đơn & lấy mã VietQR</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
            Tóm tắt đơn cày rank
          </h3>

          <div className="flex items-center gap-3 py-2 border-b border-slate-200">
            <img
              src={selectedGame.thumbnail}
              alt={selectedGame.name}
              className="w-12 h-12 rounded-xl object-contain border border-slate-200 p-1"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{selectedGame.name}</h4>
              <p className="text-xs text-orange-600 font-bold">{selectedService.name}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400">Chi tiết dịch vụ:</span>
              <span className="font-bold text-slate-900 text-right">
                {serviceType === 'RANK_TIER' && startRankTier && targetRankTier && (
                  `${startRankTier.name} → ${targetRankTier.name}`
                )}
                {serviceType === 'PER_UNIT' && (
                  `${currentUnit} → ${targetUnit} ${selectedService?.priceConfig?.unitLabel || 'sao'} (+${targetUnit - currentUnit} ${selectedService?.priceConfig?.unitLabel || 'sao'})`
                )}
                {serviceType === 'MATCH_COUNT' && (
                  `${quantity} ${selectedService?.priceConfig?.unitLabel || 'trận'}`
                )}
                {serviceType === 'FIXED_PACKAGE' && (
                  'Gói dịch vụ trọn gói'
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Tùy chọn thêm:</span>
              <span className="text-slate-700 font-semibold text-right">
                {[
                  options.isExpress && 'Cày siêu tốc',
                  options.pickRole && 'Chỉ định vị trí',
                  options.isDuo && 'Duo với booster',
                ]
                  .filter(Boolean)
                  .join(', ') || 'Không có'}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400">Giá gốc (Base):</span>
              <span className="font-mono text-slate-700">
                {pricePreview.basePrice.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Hệ số nhân:</span>
              <span className="text-emerald-600 font-bold">×{pricePreview.multiplier}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-700">Tổng thanh toán:</span>
            <span className="text-2xl font-black text-orange-600 font-mono">
              {pricePreview.totalPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
