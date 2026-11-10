import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Upload,
  Loader2,
  X,
  CreditCard,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IOrder, OrderStatus, PaymentStatus } from '../../types';

export const ManageOrders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status Update Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('in_progress');
  const [cancelReason, setCancelReason] = useState('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Refund Confirmation Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundProofFile, setRefundProofFile] = useState<File | null>(null);
  const [refundProofUrl, setRefundProofUrl] = useState('');
  const [confirmingRefund, setConfirmingRefund] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/admin/orders?page=${page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await axiosClient.get<{
        success: boolean;
        orders: IOrder[];
        totalPages: number;
        total: number;
      }>(url);

      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setError('Lỗi khi tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  // Open Status Update Modal
  const openStatusModal = (order: IOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setCancelReason(order.cancelReason || '');
    setProofImageFile(null);
    setProofImageUrl(order.proofImage || '');
    setStatusModalOpen(true);
  };

  // Open Confirm Refund Modal
  const openRefundModal = (order: IOrder) => {
    setSelectedOrder(order);
    setRefundProofFile(null);
    setRefundProofUrl('');
    setRefundModalOpen(true);
  };

  // Handle Order Status Update
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      const formData = new FormData();
      formData.append('orderStatus', newStatus);

      if (newStatus === 'canceled' && cancelReason.trim()) {
        formData.append('cancelReason', cancelReason.trim());
      }

      if (newStatus === 'completed') {
        if (proofImageFile) {
          formData.append('proofImage', proofImageFile);
        } else if (proofImageUrl.trim()) {
          formData.append('proofImage', proofImageUrl.trim());
        }
      }

      await axiosClient.patch(`/admin/orders/${selectedOrder._id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatusModalOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể cập nhật trạng thái đơn!'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Confirm Refund Submit
  const handleConfirmRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setConfirmingRefund(true);
      const formData = new FormData();

      if (refundProofFile) {
        formData.append('refundProof', refundProofFile);
      } else if (refundProofUrl.trim()) {
        formData.append('refundProof', refundProofUrl.trim());
      }

      await axiosClient.patch(`/admin/orders/${selectedOrder._id}/confirm-refund`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setRefundModalOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể xác nhận hoàn tiền!'
      );
    } finally {
      setConfirmingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            Quản Lý & Phân Phối Đơn Cày Rank
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật tiến độ cày rank, tải ảnh bằng chứng và xử lý hoàn tiền khách hàng
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gaming-dark border border-gaming-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Tất Cả Trạng Thái</option>
            <option value="pending">Chờ Xử Lý (pending)</option>
            <option value="in_progress">Đang Cày (in_progress)</option>
            <option value="completed">Đã Hoàn Thành (completed)</option>
            <option value="canceled">Đã Hủy (canceled)</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-gaming-card border border-gaming-border text-slate-400 hover:text-white"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">Chưa tìm thấy đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gaming-dark/60 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn</th>
                  <th className="py-3.5 px-4">Khách Hàng / SĐT</th>
                  <th className="py-3.5 px-4">Dịch Vụ & Chi Tiết</th>
                  <th className="py-3.5 px-4">Tài Khoản Game</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Thanh Toán</th>
                  <th className="py-3.5 px-4">Trạng Thái Đơn</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gaming-border/60 text-slate-300">
                {orders.map((o) => {
                  const clientName = typeof o.userId === 'object' && o.userId && 'name' in o.userId
                    ? o.userId.name
                    : 'Khách hàng';
                  const startName = typeof o.startRankTierId === 'object' && o.startRankTierId && 'name' in o.startRankTierId
                    ? o.startRankTierId.name
                    : '---';
                  const targetName = typeof o.targetRankTierId === 'object' && o.targetRankTierId && 'name' in o.targetRankTierId
                    ? o.targetRankTierId.name
                    : '---';

                  const config = o.serviceConfig;
                  let displayPath = `${startName} → ${targetName}`;
                  if (config) {
                    if (config.serviceType === 'PER_UNIT') {
                      displayPath = `${config.currentUnit ?? 0} → ${config.targetUnit ?? 0} ${config.unitLabel || 'sao'}`;
                    } else if (config.serviceType === 'MATCH_COUNT') {
                      displayPath = `${config.quantity ?? 1} ${config.unitLabel || 'trận'}`;
                    } else if (config.serviceType === 'FIXED_PACKAGE') {
                      displayPath = 'Gói trọn gói';
                    }
                  }

                  const serviceName = typeof o.serviceId === 'object' && o.serviceId && 'name' in o.serviceId
                    ? o.serviceId.name
                    : (config?.packageName || '');

                  const hasRefundInfo = Boolean(o.refundInfo?.accountNumber);

                  return (
                    <tr key={o._id} className="hover:bg-gaming-border/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        #{o.orderCode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{clientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{o.accountInfo.contactPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        {serviceName && (
                          <p className="text-[10px] text-cyan-400 font-semibold">{serviceName}</p>
                        )}
                        <p className="text-white font-bold">
                          {displayPath}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className="text-slate-200 font-mono">{o.accountInfo.inGameAccount}</span>
                        <span className="text-slate-500 block">Server: {o.accountInfo.inGameServer}</span>
                        {o.accountInfo.note && (
                          <span className="text-amber-400 text-[10px] block truncate max-w-[180px]" title={o.accountInfo.note}>
                            Note: {o.accountInfo.note}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {o.totalPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : o.paymentStatus === 'refunded'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.orderStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : o.orderStatus === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-400'
                              : o.orderStatus === 'canceled'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Button Update Status */}
                        <button
                          onClick={() => openStatusModal(o)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-colors"
                        >
                          Cập nhật
                        </button>

                        {/* Button Refund if canceled and has bank info */}
                        {o.orderStatus === 'canceled' && (
                          <button
                            onClick={() => openRefundModal(o)}
                            disabled={!hasRefundInfo || o.paymentStatus === 'refunded'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              o.paymentStatus === 'refunded'
                                ? 'bg-purple-500/10 text-purple-400 cursor-default'
                                : hasRefundInfo
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                            title={
                              o.paymentStatus === 'refunded'
                                ? 'Đã hoàn tiền'
                                : hasRefundInfo
                                ? 'Khách đã gửi STK - Bấm để hoàn tiền'
                                : 'Khách chưa gửi STK hoàn tiền'
                            }
                          >
                            {o.paymentStatus === 'refunded' ? 'Đã hoàn' : 'Hoàn tiền'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gaming-border flex items-center justify-between text-xs text-slate-400">
            <span>
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Update Status */}
      {statusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gaming-card border border-gaming-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
              <h3 className="text-base font-bold text-white">
                Cập Nhật Tiến Độ Đơn #{selectedOrder.orderCode}
              </h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Trạng Thái Đơn Hàng Mới:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="pending">Chờ Tiếp Nhận (pending)</option>
                  <option value="in_progress">Đang Cày Rank (in_progress)</option>
                  <option value="completed">Đã Hoàn Thành (completed)</option>
                  <option value="canceled">Hủy Đơn (canceled)</option>
                </select>
              </div>

              {/* If completed: Allow uploading proof image */}
              {newStatus === 'completed' && (
                <div className="space-y-2 p-3.5 rounded-xl bg-gaming-dark border border-gaming-border">
                  <label className="block font-bold text-cyan-400">
                    Ảnh Bằng Chứng Hoàn Thành (Screenshot chiến thắng):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL ảnh hoặc tải file"
                      value={proofImageUrl}
                      onChange={(e) => {
                        setProofImageUrl(e.target.value);
                        setProofImageFile(null);
                      }}
                      className="flex-1 bg-gaming-card border border-gaming-border rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <label className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer flex items-center gap-1 font-semibold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn file</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProofImageFile(e.target.files[0]);
                            setProofImageUrl(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {proofImageFile && (
                    <p className="text-[10px] text-emerald-400">Tệp: {proofImageFile.name}</p>
                  )}
                </div>
              )}

              {/* If canceled: Allow entering cancel reason */}
              {newStatus === 'canceled' && (
                <div className="space-y-1.5 p-3.5 rounded-xl bg-gaming-dark border border-rose-500/20">
                  <label className="block font-bold text-rose-400">
                    Lý Do Hủy Đơn Cày:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="VD: Sai thông tin mật khẩu game nhiều lần..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-gaming-card border border-gaming-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gaming-border">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500"
                >
                  {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />}
                  <span>Lưu Cập Nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Refund */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gaming-card border border-gaming-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Xác Nhận Hoàn Tiền Đơn #{selectedOrder.orderCode}
              </h3>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-gaming-dark p-3.5 rounded-xl border border-gaming-border text-xs">
              <span className="font-semibold text-slate-400 block text-xs">
                STK khách cung cấp:
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-white">{selectedOrder.refundInfo?.bankName || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {selectedOrder.refundInfo?.accountNumber || '---'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-emerald-400">
                  {selectedOrder.refundInfo?.accountHolder || '---'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gaming-border/60">
                <span className="text-slate-400">Số tiền cần hoàn trả:</span>
                <span className="font-mono font-extrabold text-sm text-emerald-400">
                  {selectedOrder.totalPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRefundSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">
                  Tải Ảnh Bill Chuyển Khoản Hoàn Tiền (refundProof):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc tải file"
                    value={refundProofUrl}
                    onChange={(e) => {
                      setRefundProofUrl(e.target.value);
                      setRefundProofFile(null);
                    }}
                    className="flex-1 bg-gaming-dark border border-gaming-border rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <label className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải file</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRefundProofFile(e.target.files[0]);
                          setRefundProofUrl(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>
                {refundProofFile && (
                  <p className="text-[10px] text-emerald-400">Tệp: {refundProofFile.name}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gaming-border">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={confirmingRefund}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  {confirmingRefund && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />}
                  <span>Xác Nhận Đã Hoàn Tiền</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;

