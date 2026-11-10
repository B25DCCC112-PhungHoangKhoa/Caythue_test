import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Gamepad2,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { IGame, IRankTier } from '../../types';

export const ManageRankTiers: React.FC = () => {
  const [games, setGames] = useState<IGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [rankTiers, setRankTiers] = useState<IRankTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<IRankTier | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [index, setIndex] = useState<number>(0);
  const [costToNext, setCostToNext] = useState<number>(50000);

  // 1. Fetch Games list
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axiosClient.get<{ success: boolean; games: IGame[] }>('/games?all=true');
        if (res.data.success && res.data.games.length > 0) {
          setGames(res.data.games);
          setSelectedGameId(res.data.games[0]._id);
        }
      } catch {
        setError('Không thể tải danh sách game.');
      }
    };
    fetchGames();
  }, []);

  // 2. Fetch Rank Tiers when game selection changes
  const fetchRankTiers = async (gameId: string) => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get<{ success: boolean; rankTiers: IRankTier[] }>(
        `/rank-tiers?gameId=${gameId}`
      );
      if (res.data.success) {
        setRankTiers(res.data.rankTiers);
      }
    } catch {
      setError('Lỗi khi tải danh sách bậc rank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      fetchRankTiers(selectedGameId);
    }
  }, [selectedGameId]);

  const openCreateModal = () => {
    setEditingTier(null);
    setName('');
    const nextIndex = rankTiers.length > 0 ? Math.max(...rankTiers.map((t) => t.index)) + 1 : 0;
    setIndex(nextIndex);
    setCostToNext(50000);
    setModalOpen(true);
  };

  const openEditModal = (tier: IRankTier) => {
    setEditingTier(tier);
    setName(tier.name);
    setIndex(tier.index);
    setCostToNext(tier.costToNext);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGameId) return;

    try {
      setSubmitting(true);
      if (editingTier) {
        await axiosClient.put(`/admin/rank-tiers/${editingTier._id}`, {
          name: name.trim(),
          index: Number(index),
          costToNext: Number(costToNext),
        });
      } else {
        await axiosClient.post('/admin/rank-tiers', {
          gameId: selectedGameId,
          name: name.trim(),
          index: Number(index),
          costToNext: Number(costToNext),
        });
      }

      setModalOpen(false);
      fetchRankTiers(selectedGameId);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Lỗi khi lưu thông tin bậc rank'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bậc rank này?')) return;
    try {
      await axiosClient.delete(`/admin/rank-tiers/${tierId}`);
      fetchRankTiers(selectedGameId);
    } catch {
      alert('Không thể xóa bậc rank này!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Game Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            Cấu Hình Phân Bậc Rank & Chi Phí
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập thứ tự index và giá vượt bậc để thuật toán tính giá hoạt động chính xác
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={!selectedGameId}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          Thêm Bậc Rank Mới
        </button>
      </div>

      {/* Game Selector Bar */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          Chọn Tựa Game Cần Quản Lý:
        </label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 sm:max-w-xs"
        >
          {games.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-slate-400 sm:ml-auto">
          Hiện có: <strong className="text-cyan-400">{rankTiers.length}</strong> bậc rank được định nghĩa
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rank Tiers Table */}
      <div className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách bậc rank…</div>
        ) : rankTiers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Chưa có bậc rank nào cho tựa game này. Hãy bấm “Thêm Bậc Rank Mới”!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gaming-dark/60 text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Index Thứ Tự</th>
                  <th className="py-3.5 px-4">Tên Bậc Rank</th>
                  <th className="py-3.5 px-4">Chi Phí Lên Bậc Kế Tiếp (costToNext)</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gaming-border/60 text-slate-300">
                {rankTiers.map((tier) => (
                  <tr key={tier._id} className="hover:bg-gaming-border/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {tier.index}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">{tier.name}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                      {tier.costToNext.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(tier)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tier._id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gaming-card border border-gaming-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gaming-border">
              <h3 className="text-base font-bold text-white">
                {editingTier ? 'Sửa Bậc Rank' : 'Thêm Bậc Rank Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên Bậc Rank <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Vàng IV, Kim Cương I, Cao Thủ..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chỉ Số Thứ Tự (Index) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={index}
                  onChange={(e) => setIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Chỉ số tăng dần: Rank thấp nhất là 0, bậc tiếp theo là 1, 2, 3...
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chi Phí Leo Tiếp Theo (costToNext - VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={costToNext}
                  onChange={(e) => setCostToNext(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-gaming-dark border border-gaming-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gaming-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-500"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />}
                  <span>{editingTier ? 'Lưu Thay Đổi' : 'Thêm Bậc'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRankTiers;

