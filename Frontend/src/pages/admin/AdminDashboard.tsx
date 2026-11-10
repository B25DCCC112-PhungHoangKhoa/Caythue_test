import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Gamepad2,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IOrder, IGame, IService } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [games, setGames] = useState<IGame[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, gamesRes, servicesRes] = await Promise.all([
        axiosClient.get<{ success: boolean; orders: IOrder[] }>('/admin/orders?limit=100'),
        axiosClient.get<{ success: boolean; games: IGame[] }>('/games?all=true'),
        axiosClient.get<{ success: boolean; services: IService[] }>('/services'),
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      if (gamesRes.data.success) setGames(gamesRes.data.games);
      if (servicesRes.data.success) setServices(servicesRes.data.services);
    } catch {
      // Ignore or log error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' || o.orderStatus === 'completed')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const inProgressCount = orders.filter((o) => o.orderStatus === 'in_progress').length;
  const completedCount = orders.filter((o) => o.orderStatus === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Tổng Quan Quản Trị Hệ Thống</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi doanh thu, trạng thái các đơn cày rank và tình trạng máy chủ.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-gaming-card border border-gaming-border hover:border-slate-600 text-xs font-semibold text-slate-300 transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500 disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Cập nhật số liệu
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gaming-card border border-gaming-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Tổng doanh thu</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Đã thanh toán / Hoàn thành</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-gaming-card border border-gaming-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Chờ xử lý</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Cần tiếp nhận & giao booster</span>
        </div>

        {/* In Progress */}
        <div className="bg-gaming-card border border-gaming-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Đang cày rank</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono">{inProgressCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Booster đang cày tài khoản</span>
        </div>

        {/* Completed */}
        <div className="bg-gaming-card border border-gaming-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-400" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-400">Hoàn thành</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono">{completedCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tỉ lệ hoàn thành: {orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/games"
          className="p-5 rounded-2xl bg-gaming-card border border-gaming-border hover:border-cyan-500/40 transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-cyan-500 motion-reduce:transform-none flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Quản Lý Tựa Game</p>
              <p className="text-xs text-slate-400">{games.length} trò chơi đang quản lý</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </Link>

        <Link
          to="/admin/services"
          className="p-5 rounded-2xl bg-gaming-card border border-gaming-border hover:border-emerald-500/40 transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-emerald-500 motion-reduce:transform-none flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Quản Lý Gói Dịch Vụ</p>
              <p className="text-xs text-slate-400">{services.length} gói cày & hệ số phụ phí</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Link>

        <Link
          to="/admin/orders"
          className="p-5 rounded-2xl bg-gaming-card border border-gaming-border hover:border-purple-500/40 transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-purple-500 motion-reduce:transform-none flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Quản Lý Đơn Hàng</p>
              <p className="text-xs text-slate-400">{orders.length} tổng số đơn đặt cày</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
        </Link>
      </div>

      {/* Latest Orders Table */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gaming-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Đơn Hàng Gần Đây Cần Xử Lý</h3>
            <p className="text-xs text-slate-400">Danh sách 8 đơn hàng mới nhất trên hệ thống</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu đơn hàng…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Chưa có đơn hàng nào trên hệ thống.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gaming-dark/60 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Chặng Cày Rank</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Thanh Toán</th>
                  <th className="py-3 px-4">Trạng Thái Đơn</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gaming-border/60 text-slate-300">
                {orders.slice(0, 8).map((order) => {
                  const clientName = typeof order.userId === 'object' && order.userId && 'name' in order.userId
                    ? order.userId.name
                    : 'Khách hàng';
                  const startName = typeof order.startRankTierId === 'object' && order.startRankTierId && 'name' in order.startRankTierId
                    ? order.startRankTierId.name
                    : '---';
                  const targetName = typeof order.targetRankTierId === 'object' && order.targetRankTierId && 'name' in order.targetRankTierId
                    ? order.targetRankTierId.name
                    : '---';

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
                    <tr key={order._id} className="hover:bg-gaming-border/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        #{order.orderCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{clientName}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{displayPath}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {order.totalPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : order.paymentStatus === 'refunded'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.orderStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : order.orderStatus === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-400'
                              : order.orderStatus === 'canceled'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/admin/orders"
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          Xử lý
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

