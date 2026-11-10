import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { VietQRModal } from '../../components/ui/VietQRModal';
import type { IOrder } from '../../types';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show/Hide Game Password
  const [showPassword, setShowPassword] = useState(false);

  // VietQR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Refund Form State
  const [refundForm, setRefundForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);
  const [refundErrorMsg, setRefundErrorMsg] = useState<string | null>(null);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchOrderDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get<{ success: boolean; order: IOrder }>(`/orders/${id}`);
      if (res.data.success && res.data.order) {
        setOrder(res.data.order);
        if (res.data.order.refundInfo?.accountNumber) {
          setRefundForm({
            bankName: res.data.order.refundInfo.bankName || '',
            accountNumber: res.data.order.refundInfo.accountNumber || '',
            accountHolder: res.data.order.refundInfo.accountHolder || '',
          });
        }
      }
    } catch {
      setError('Không tìm thấy thông tin đơn hàng này hoặc bạn không có quyền xem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Handle Client Submitting Refund Bank Account Info
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRefundErrorMsg(null);
    setRefundSuccessMsg(null);

    if (!refundForm.bankName.trim() || !refundForm.accountNumber.trim() || !refundForm.accountHolder.trim()) {
      setRefundErrorMsg('Vui lòng điền đầy đủ tên ngân hàng, số tài khoản và tên chủ tài khoản!');
      return;
    }

    try {
      setSubmittingRefund(true);
      const res = await axiosClient.patch<{ success: boolean; message: string; order: IOrder }>(
        `/orders/${id}/refund-info`,
        refundForm
      );
      if (res.data.success) {
        setRefundSuccessMsg('Gửi thông tin số tài khoản hoàn tiền thành công! Admin sẽ sớm chuyển khoản lại.');
        setOrder(res.data.order);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi thông tin hoàn tiền lúc này.';
      setRefundErrorMsg(msg);
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Handle Client Submitting Review for Completed Order
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setReviewErrorMsg(null);
    setReviewSuccessMsg(null);

    if (!comment.trim()) {
      setReviewErrorMsg('Vui lòng viết vài dòng nhận xét đánh giá!');
      return;
    }

    try {
      setSubmittingReview(true);
      const serviceId = typeof order.serviceId === 'object' ? order.serviceId._id : order.serviceId;

      const res = await axiosClient.post<{ success: boolean; message: string }>('/reviews', {
        orderId: order._id,
        serviceId,
        rating,
        comment: comment.trim(),
      });

      if (res.data.success) {
        setReviewSuccessMsg('Cảm ơn bạn đã gửi đánh giá chất lượng dịch vụ!');
        setHasReviewed(true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể gửi đánh giá cho đơn này.';
      setReviewErrorMsg(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-3" />
        <p className="text-xs text-slate-500">Đang tải thông tin chi tiết đơn hàng…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-rose-600 shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto" />
          <h2 className="text-lg font-bold">{error || 'Không tìm thấy đơn hàng'}</h2>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Danh Sách Đơn
          </Link>
        </div>
      </div>
    );
  }

  const serviceName = typeof order.serviceId === 'object' && 'name' in order.serviceId
    ? order.serviceId.name
    : 'Dịch Vụ Cày Rank';
  const startTierName = typeof order.startRankTierId === 'object' && order.startRankTierId && 'name' in order.startRankTierId
    ? order.startRankTierId.name
    : 'Rank Nguồn';
  const targetTierName = typeof order.targetRankTierId === 'object' && order.targetRankTierId && 'name' in order.targetRankTierId
    ? order.targetRankTierId.name
    : 'Rank Đích';

  const config = order.serviceConfig;
  let serviceDetailText = `${startTierName} → ${targetTierName}`;
  if (config) {
    if (config.serviceType === 'PER_UNIT') {
      serviceDetailText = `${config.currentUnit ?? 0} → ${config.targetUnit ?? 0} ${config.unitLabel || 'sao'}`;
    } else if (config.serviceType === 'MATCH_COUNT') {
      serviceDetailText = `${config.quantity ?? 1} ${config.unitLabel || 'trận'}`;
    } else if (config.serviceType === 'FIXED_PACKAGE') {
      serviceDetailText = 'Gói dịch vụ trọn gói';
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách đơn hàng
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">Đơn hàng #{order.orderCode}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.orderStatus === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : order.orderStatus === 'in_progress'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : order.orderStatus === 'canceled'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {order.orderStatus === 'completed'
                ? 'Hoàn thành'
                : order.orderStatus === 'in_progress'
                ? 'Đang cày'
                : order.orderStatus === 'canceled'
                ? 'Đã hủy'
                : 'Chờ xử lý'}
            </span>
          </div>
        </div>

        {/* VietQR Trigger Button */}
        {order.paymentStatus === 'pending' && order.qrUrl && (
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 motion-reduce:transform-none self-start sm:self-auto"
          >
            <QrCode className="w-4 h-4" />
            Xem mã VietQR thanh toán
          </button>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Order Info & In-game Account */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Configuration Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
              Chi tiết chặng cày rank
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <span className="font-bold text-orange-600">{serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chi tiết thực hiện:</span>
                <span className="font-black text-slate-900">
                  {serviceDetailText}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tùy chọn:</span>
                <span className="text-slate-700 font-medium">
                  {[
                    order.options.isExpress && 'Cày siêu tốc',
                    order.options.pickRole && 'Chỉ định vị trí',
                    order.options.isDuo && 'Duo với booster',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Tiêu chuẩn'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Trạng thái thanh toán:</span>
                <span
                  className={`font-bold ${
                    order.paymentStatus === 'paid'
                      ? 'text-emerald-700'
                      : order.paymentStatus === 'refunded'
                      ? 'text-purple-700'
                      : 'text-amber-700'
                  }`}
                >
                  {order.paymentStatus === 'paid'
                    ? 'Đã Thanh Toán'
                    : order.paymentStatus === 'refunded'
                    ? 'Đã Hoàn Tiền'
                    : 'Chờ Chuyển Khoản'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng chi phí:</span>
                <span className="font-mono font-black text-base text-orange-600">
                  {order.totalPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* In-game Account Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>Thông tin tài khoản bàn giao</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Bảo Mật SSL
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tài khoản đăng nhập:</span>
                <span className="font-mono font-bold text-slate-900">{order.accountInfo.inGameAccount}</span>
              </div>

              {order.accountInfo.inGamePassword && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mật khẩu game:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 font-bold">
                      {showPassword ? order.accountInfo.inGamePassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title={showPassword ? 'Ẩn' : 'Hiện'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Tên nhân vật (IGN):</span>
                <span className="text-slate-800">{order.accountInfo.inGameName || '---'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Máy chủ:</span>
                <span className="text-slate-800">{order.accountInfo.inGameServer}</span>
              </div>

              {order.accountInfo.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">SĐT/Zalo liên hệ:</span>
                  <span className="font-bold text-orange-600">{order.accountInfo.contactPhone}</span>
                </div>
              )}

              {order.accountInfo.note && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Ghi chú của bạn:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic text-[11px]">
                    "{order.accountInfo.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Dynamic Actions (Proof, Refund, or Review) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Case 1: Order Completed -> Show Proof Image & Review Form */}
          {order.orderStatus === 'completed' && (
            <div className="bg-white border border-emerald-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Đơn Hàng Đã Hoàn Thành Xuất Sắc!
              </div>

              {/* Proof Image */}
              {order.proofImage ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    Ảnh Bằng Chứng Hoàn Thành (Proof):
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <a href={order.proofImage} target="_blank" rel="noopener noreferrer">
                      <img
                        src={order.proofImage}
                        alt="Bằng chứng hoàn thành"
                        className="w-full h-48 object-cover"
                      />
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Bấm vào ảnh để xem kích thước lớn</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Booster chưa cập nhật ảnh bằng chứng.</p>
              )}

              {/* Review Form */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  Đánh giá dịch vụ của booster
                </h4>

                {reviewSuccessMsg ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    {reviewSuccessMsg}
                  </div>
                ) : hasReviewed ? (
                  <p className="text-xs text-slate-500">Bạn đã đánh giá đơn hàng này.</p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    {reviewErrorMsg && (
                      <p className="text-xs text-rose-600">{reviewErrorMsg}</p>
                    )}

                    {/* Star selection */}
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Số sao chấm điểm:</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className="p-1 text-slate-300 hover:text-amber-400 focus-visible:outline-hidden transition-colors"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-500 ml-2">{rating}/5 Sao</span>
                      </div>
                    </div>

                    {/* Comment */}
                    <textarea
                      rows={3}
                      required
                      placeholder="Nhận xét về thái độ booster, win rate, tốc độ hoàn thành..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {submittingReview ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi Đánh Giá Ngay</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Case 2: Order Canceled -> Show Cancel Reason & Refund Form */}
          {order.orderStatus === 'canceled' && (
            <div className="bg-white border border-rose-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                Đơn Hàng Đã Bị Hủy
              </div>

              {order.cancelReason && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <span className="font-bold block mb-0.5">Lý do hủy từ Admin:</span>
                  <p>{order.cancelReason}</p>
                </div>
              )}

              {/* Refund Info Section */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  Thông tin nhận tiền hoàn trả (100%)
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Vui lòng cung cấp số tài khoản chính xác để Admin giải ngân hoàn tiền.
                </p>

                {refundSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs mb-3 font-semibold">
                    {refundSuccessMsg}
                  </div>
                )}

                {refundErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs mb-3">
                    {refundErrorMsg}
                  </div>
                )}

                {order.paymentStatus === 'refunded' ? (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                    <p className="font-bold text-purple-700">✓ Đơn hàng đã được hoàn tiền thành công!</p>
                    {order.refundInfo?.refundedAt && (
                      <p className="text-[11px] text-slate-500">
                        Thời gian: {new Date(order.refundInfo.refundedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                    {order.refundInfo?.refundProof && (
                      <div className="mt-2">
                        <span className="text-[11px] text-slate-600 block mb-1">Ảnh bill hoàn tiền:</span>
                        <a href={order.refundInfo.refundProof} target="_blank" rel="noopener noreferrer">
                          <img
                            src={order.refundInfo.refundProof}
                            alt="Bill hoàn tiền"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleRefundSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tên Ngân Hàng (VD: MBBank, Vietcombank, TPBank)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập tên ngân hàng"
                        value={refundForm.bankName}
                        onChange={(e) => setRefundForm({ ...refundForm, bankName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Số Tài Khoản Ngân Hàng
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập số tài khoản"
                        value={refundForm.accountNumber}
                        onChange={(e) => setRefundForm({ ...refundForm, accountNumber: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tên Chủ Tài Khoản (Không dấu in hoa)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: NGUYEN VAN A"
                        value={refundForm.accountHolder}
                        onChange={(e) => setRefundForm({ ...refundForm, accountHolder: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRefund}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 disabled:opacity-50 shadow-sm motion-reduce:transform-none whitespace-nowrap"
                    >
                      {submittingRefund ? (
                        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <span>Gửi thông tin nhận tiền hoàn</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Case 3: Order Pending / In Progress instructions */}
          {(order.orderStatus === 'pending' || order.orderStatus === 'in_progress') && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                Hướng dẫn trong thời gian cày rank
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                <li>Vui lòng không tự ý đăng nhập nick game khi đơn đang có trạng thái <strong>Đang Cày</strong>.</li>
                <li>Booster sẽ liên hệ qua SĐT/Zalo nếu gặp mã xác thực OTP 2 lớp.</li>
                <li>Sau khi hoàn thành, ảnh chụp chiến thắng sẽ được cập nhật trực tiếp tại trang này.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* VietQR Modal */}
      {order.qrUrl && (
        <VietQRModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          qrUrl={order.qrUrl}
          orderCode={order.orderCode}
          transferCode={order.transferCode}
          transferMessage={order.transferMessage}
          bankInfo={order.bankInfo}
          totalPrice={order.totalPrice}
          orderId={order._id}
        />
      )}
    </div>
  );
};

export default OrderDetailPage;
