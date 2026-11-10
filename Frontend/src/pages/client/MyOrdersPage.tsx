import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  ArrowRight,
  QrCode,
  DollarSign,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IOrder, OrderStatus } from '../../types';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get<{ success: boolean; orders: IOrder[] }>('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch {
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter((o) => o.orderStatus === selectedStatus);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            Chờ Tiếp Nhận
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Đang Cày Rank
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            ✓ Đã Hoàn Thành
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
            Đã Hủy
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Đã Thanh Toán
          </span>
        );
      case 'refunded':
        return (
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Đã Hoàn Tiền
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            Chờ Quét VietQR
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-orange-600" />
            Đơn Hàng Cày Rank Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Theo dõi tiến độ, bàn giao tài khoản và nhận hoàn tiền khi cần.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 shadow-xs transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {[
          { key: 'all', label: 'Tất Cả' },
          { key: 'pending', label: 'Chờ Xử Lý' },
          { key: 'in_progress', label: 'Đang Cày' },
          { key: 'completed', label: 'Hoàn Thành' },
          { key: 'canceled', label: 'Đã Hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key as OrderStatus | 'all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-orange-500 motion-reduce:transform-none whitespace-nowrap ${
              selectedStatus === tab.key
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-3" />
          <p className="text-xs text-slate-500">Đang tải lịch sử đơn cày rank…</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-white border border-rose-200 text-rose-600 text-center text-xs shadow-xs">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-sm">
          <Gamepad2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Chưa Có Đơn Hàng Nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn chưa có đơn cày rank nào trong mục này. Hãy chọn tựa game yêu thích để khởi tạo đơn ngay!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md shadow-orange-600/20"
          >
            Đặt Đơn Cày Rank Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const serviceName = typeof order.serviceId === 'object' && order.serviceId && 'name' in order.serviceId
              ? order.serviceId.name
              : 'Gói Dịch Vụ';
            const startName = typeof order.startRankTierId === 'object' && order.startRankTierId && 'name' in order.startRankTierId
              ? order.startRankTierId.name
              : 'Rank Nguồn';
            const targetName = typeof order.targetRankTierId === 'object' && order.targetRankTierId && 'name' in order.targetRankTierId
              ? order.targetRankTierId.name
              : 'Rank Đích';

            const config = order.serviceConfig;
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

            return (
              <div
                key={order._id}
                className="bg-white border border-slate-200 hover:border-orange-300 rounded-3xl p-5 transition-colors shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-orange-600">
                      #{order.orderCode}
                    </span>
                    {getOrderStatusBadge(order.orderStatus)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {serviceName}: <span className="text-slate-600">{displayPath}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '---'}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                      <DollarSign className="w-3.5 h-3.5" />
                      {order.totalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <Link
                    to={`/orders/${order._id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    Xem Chi Tiết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
